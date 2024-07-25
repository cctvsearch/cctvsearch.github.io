const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

var mapContainer = document.getElementById('map');
var roadviewContainer = document.getElementById('roadview');
var mapOption = {
    center: new kakao.maps.LatLng(37.4295040000, 126.9883220000),
    level: 5
};
var map = new kakao.maps.Map(mapContainer, mapOption);
var roadview = new kakao.maps.Roadview(roadviewContainer);
var roadviewClient = new kakao.maps.RoadviewClient();
var markers = [];
var currentOverlay = null;
var isLatLngClickMode = false;
var tempOverlay = null;
var roadviewMode = false;

// 지도 클릭 시 로드뷰로 진입
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    if (roadviewMode) {
        var latlng = mouseEvent.latLng;
        roadviewClient.getNearestPanoId(latlng, 50, function(panoId) {
            if (panoId) {
                roadview.setPanoId(panoId, latlng);
            }
        });
    }
});

// 로드뷰 클릭 시 로드뷰 창으로 진입
kakao.maps.event.addListener(roadview, 'position_changed', function() {
    var position = roadview.getPosition();
    if (position) {
        var latlng = new kakao.maps.LatLng(position.getLat(), position.getLng());
        map.setCenter(latlng);
        map.setLevel(4);
    }
});

// 로드뷰 버튼 클릭 시 토글 기능
function toggleRoadview() {
    if (roadviewContainer.style.display === 'none') {
        roadviewContainer.style.display = 'block';
        mapContainer.style.display = 'none';
        map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW); // 로드뷰 제거
        roadviewMode = true;

        // 지도와 UI 숨기기
        document.getElementById('categoryDropdownContainer').style.display = 'none';
        document.getElementById('newSearchForm').style.display = 'none';
        document.getElementById('latLngButton').style.display = 'none';
        document.getElementById('roadviewToggle').style.display = 'none';
        document.getElementById('currentPosButton').style.display = 'none';
    } else {
        roadviewContainer.style.display = 'none';
        mapContainer.style.display = 'block';
        map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW); // 로드뷰 추가
        roadviewMode = false;

        // 지도와 UI 보이기
        document.getElementById('categoryDropdownContainer').style.display = 'block';
        document.getElementById('newSearchForm').style.display = 'flex';
        document.getElementById('latLngButton').style.display = 'block';
        document.getElementById('roadviewToggle').style.display = 'block';
        document.getElementById('currentPosButton').style.display = 'block';
    }
    map.relayout(); // 지도를 다시 레이아웃하여 정상적으로 표시되도록 함
}

// 로드뷰 버튼 클릭 이벤트 추가
var roadviewToggleBtn = document.getElementById('roadviewToggle');
roadviewToggleBtn.addEventListener('click', function() {
    toggleRoadview();
    if (roadviewContainer.style.display === 'block') {
        var position = map.getCenter();
        roadviewClient.getNearestPanoId(position, 50, function(panoId) {
            if (panoId) {
                roadview.setPanoId(panoId, position);
            }
        });
    }
});

// 사용자 검색 시 로드뷰 적용
newSearchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    var userInput = newSearchInput.value.trim();

    var position = null;
    var markerIndex = -1;

    var latLngPattern = /(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/;
    if (latLngPattern.test(userInput)) {
        var match = userInput.match(latLngPattern);
        var lat = parseFloat(match[1]);
        var lng = parseFloat(match[3]);
        position = new kakao.maps.LatLng(lat, lng);

        allPositions.forEach(function(pos, index) {
            if (pos.lat === lat && pos.lng === lng) {
                markerIndex = index;
                return false;
            }
        });
    } else {
        var filtered = allInfo.filter(function(item) {
            return item.number.toLowerCase() === userInput.toLowerCase();
        });
        if (filtered.length > 0) {
            var foundItem = filtered[0];
            var index = allInfo.indexOf(foundItem);
            position = new kakao.maps.LatLng(allPositions[index].lat, allPositions[index].lng);
            markerIndex = index;
        }
    }

    if (position) {
        map.setCenter(position);
        map.setLevel(4);

        createMarkersAndOverlays('전부');

        if (markerIndex !== -1) {
            kakao.maps.event.trigger(markers[markerIndex], 'click');
        } else {
            var tempMarker = new kakao.maps.Marker({
                position: position,
                map: map
            });

            var tempOverlayContent =
                '<div class="customOverlay">' +
                '    <span class="closeBtn" onclick="closeTempOverlay()">×</span>' +
                '    해당 위치에 정보가 없습니다.' +
                '</div>';

            tempOverlay = new kakao.maps.CustomOverlay({
                content: tempOverlayContent,
                map: map,
                position: position,
                yAnchor: 2.0
            });

            setTimeout(function() {
                tempMarker.setMap(null);
                tempOverlay.setMap(null);
            }, 3000);
        }
    } else {
        alert('유효한 위도/경도 또는 관리번호를 입력하세요.');
    }
});

function closeTempOverlay() {
    if (tempOverlay) {
        tempOverlay.setMap(null);
        tempOverlay = null;
    }
}

var latLngButton = document.getElementById('latLngButton');

latLngButton.addEventListener('click', function() {
    isLatLngClickMode = !isLatLngClickMode;
    if (isLatLngClickMode) {
        latLngButton.textContent = '끄기';
    } else {
        latLngButton.textContent = '찾기';
    }
});

kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    if (isLatLngClickMode) {
        var latlng = mouseEvent.latLng;

        closeTempOverlay();

        var tempOverlayContent =
            '<div class="customOverlay">' +
            '    <span class="closeBtn" onclick="closeTempOverlay()">×</span>' +
            '    클릭한 위치의 위도는 ' + latlng.getLat() + ' 이고, 경도는 ' + latlng.getLng() + ' 입니다' +
            '</div>';
        tempOverlay = new kakao.maps.CustomOverlay({
            content: tempOverlayContent,
            map: map,
            position: latlng,
            yAnchor: 2.0
        });

        var tempMarker = new kakao.maps.Marker({
            position: latlng,
            map: map
        });

        setTimeout(function() {
            tempMarker.setMap(null);
        }, 3000);
    }
});

function updateButtonText() {
    const latLngButton = document.getElementById('latLngButton');
    const roadviewToggle = document.getElementById('roadviewToggle');

    if (window.innerWidth <= 728) {
        latLngButton.textContent = '좌표';
        roadviewToggle.textContent = '로드뷰';
    } else {
        latLngButton.textContent = '좌표';
        roadviewToggle.textContent = '로드뷰';
    }
}

var currentPosButton = document.createElement('button');
currentPosButton.id = 'currentPosButton'; // CSS 스타일 적용을 위해 id를 설정합니다

// 이미지를 버튼에 추가합니다
var img = document.createElement('img');
img.src = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/maker.png?raw=true'; // 이미지 URL을 지정합니다

currentPosButton.appendChild(img);
document.body.appendChild(currentPosButton);

function displayMarker(locPosition, message) {
    var marker = new kakao.maps.Marker({
        map: map,
        position: locPosition
    });

    var iwContent = message;
    var infowindow = new kakao.maps.InfoWindow({
        content: iwContent,
        removable: true
    });
    infowindow.open(map, marker);

    // 3초 후에 마커와 인포윈도우를 제거합니다
    setTimeout(function() {
        marker.setMap(null);
        infowindow.close();
    }, 3000);
}

function getCurrentPos() {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            var locPosition = new kakao.maps.LatLng(lat, lon);
            var message = '<div style="height: 25px; padding:2px 10px; margin: 3px;">현재 위치입니다.</div>';
            displayMarker(locPosition, message);
            map.setCenter(locPosition); // 현재 위치로 지도를 이동
        },
        function (error) {
            console.error('위치 정보를 가져오는 데 실패했습니다:', error.message);
        }
    );
}

currentPosButton.addEventListener('click', getCurrentPos); // 버튼 클릭 시 getCurrentPos 함수 호출

// 페이지 로드 시 버튼 텍스트 업데이트
window.addEventListener('load', updateButtonText);
// 화면 크기 조정 시 버튼 텍스트 업데이트
window.addEventListener('resize', updateButtonText);
