// 마커 데이터 및 연결 정보
const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

var markerConnections = {
    'A-GC-25': {
        red: ['A-GC-6', 'A-GC-17', 'A-GC-18', 'A-GC-19', 'A-GC-20', 'A-GC-22', 'A-GC-5', 'A-GC-7', 'A-GC-21', 'A-GC-14', 'A-GC-15', 'A-GC-16'],
        blue: ['A-GC-29', 'A-GC-41'],
        black: ['A-GC-13', 'A-GC-23', 'A-GC-24']
    },
    'A-GC-27': {
        red: ['A-GC-26', 'A-GC-2', 'A-GC-28', 'A-GC-1'],
        blue: ['A-GC-45', 'A-JA-42']
    }
};

var polylines = []; // 선을 저장할 배열
var lastClickedMarker = null; // 마지막으로 클릭한 마커
var lastBaseMarkerNumber = null; // 마지막 기준 마커 번호

// 폴리라인 초기화 함수
function clearPolylines() {
    polylines.forEach(function(line) {
        line.setMap(null);
    });
    polylines = []; // 초기화
}

// 마커 클릭 시 연결된 선을 그리는 함수
function handleMarkerClick(clickedMarker, markerInfo) {
    // 이전에 클릭한 마커가 있으면 원래 이미지로 되돌림
    if (lastClickedMarker) {
        lastClickedMarker.setImage(new kakao.maps.MarkerImage(defaultMarkerImageUrl, new kakao.maps.Size(30, 40)));
    }

    // 현재 클릭한 마커의 이미지를 변경
    clickedMarker.setImage(new kakao.maps.MarkerImage(clickedMarkerImageUrl, new kakao.maps.Size(30, 40)));
    lastClickedMarker = clickedMarker;

    // 기준 마커가 변경된 경우에만 폴리라인을 새로 그리기
    if (markerInfo.number !== lastBaseMarkerNumber) {
        clearPolylines(); // 기존 선 제거

        // 새로운 기준 마커에 연결된 선 그리기
        var connections = markerConnections[markerInfo.number];
        if (connections) {
            if (connections.red) {
                drawPolyline(clickedMarker, connections.red, '#FF0000'); // 빨간선
            }
            if (connections.blue) {
                drawPolyline(clickedMarker, connections.blue, '#0000FF'); // 파란선
            }
            if (connections.black) {
                drawPolyline(clickedMarker, connections.black, '#000000'); // 검정선
            }

            // 새로운 기준 마커로 설정
            lastBaseMarkerNumber = markerInfo.number; // 기준 마커 번호 업데이트
        }
    }

    // 커스텀 오버레이 표시 (모든 마커에서 오버레이가 뜨도록 보장)
    showCustomOverlay(clickedMarker.getPosition(), allInfo.findIndex(info => info.number === markerInfo.number));
}

// 마커 간의 폴리라인 그리기
function drawPolyline(startMarker, connectedMarkerIds, color) {
    var path = [startMarker.getPosition()];
    connectedMarkerIds.forEach(function(id) {
        var targetMarker = findMarkerById(id);
        if (targetMarker) {
            path.push(targetMarker.getPosition());
        }
    });

    var polyline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: 5,
        strokeColor: color,
        strokeOpacity: 1,
        strokeStyle: 'solid'
    });

    polyline.setMap(map);
    polylines.push(polyline);
}

// 마커 ID로 마커 찾기
function findMarkerById(markerId) {
    var index = allInfo.findIndex(info => info.number === markerId);
    if (index !== -1) {
        return markers[index];
    }
    return null;
}

// 커스텀 오버레이를 닫을 때 선이 남아있게 수정 (clearPolylines 제거)
function closeCustomOverlay() {
    if (currentOverlay) {
        currentOverlay.setMap(null);
        currentOverlay = null;
    }
}

var mapContainer = document.getElementById('map');
var roadviewContainer = document.getElementById('roadview');
var minimapMarkers = [];
var mapOption = {
    center: new kakao.maps.LatLng(37.4295040000, 126.9883220000),
    level: 5
};
var map = new kakao.maps.Map(mapContainer, mapOption);
var geocoder = new kakao.maps.services.Geocoder();
var roadview = new kakao.maps.Roadview(roadviewContainer);
var roadviewClient = new kakao.maps.RoadviewClient();

// 미니맵을 생성합니다.
var minimapContainer = document.getElementById('minimap');
var minimap = new kakao.maps.Map(minimapContainer, {
    center: new kakao.maps.LatLng(37.4295040000, 126.9883220000),
    level: 3
});

kakao.maps.event.addListener(roadview, 'init', function() {
    kakao.maps.event.addListener(roadview, 'viewpoint_changed', function() {
        var viewpoint = roadview.getViewpoint();
    });

    kakao.maps.event.addListener(roadview, 'position_changed', function() {
        var position = roadview.getPosition();
        map.setCenter(position);
        minimap.setCenter(position); // 미니맵의 중심 업데이트
    });
});

var isRoadviewEnabled = false;

kakao.maps.event.addListener(map, 'idle', function() {
    if (isRoadviewEnabled) {
        var position = map.getCenter();
        roadviewClient.getNearestPanoId(position, 50, function(panoId) {
            if (panoId) {
                roadview.setPanoId(panoId, position);
            }
        });
    }
});

var categories = ['갈현동', '과천동', '문원동', '별양동', '부림동', '주암동', '중앙동', '기타', '회전형', '고정형', '전부'];

var markers = [];
var currentOverlay = null;
var isLatLngClickMode = false;
var tempOverlay = null;

createMarkersAndOverlays('전부');

// Define the new marker image URL
const clickedMarkerImageUrl = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/marker_spot2.png?raw=true';
const defaultMarkerImageUrl = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png';

function createMarkersAndOverlays(category) {
    closeCustomOverlay();

    // 기존 마커 제거
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];

    // 미니맵 마커 제거
    minimapMarkers.forEach(function(marker) {
        marker.setMap(null);
    });
    minimapMarkers = [];

    // 카테고리별 마커 이미지 URL 및 사이즈 정의
    var markerImageUrl = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'; // 기본 이미지
    var markerSize = new kakao.maps.Size(30, 40); // 기본 사이즈

    if (category === '회전형') {
        markerImageUrl = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/category1.png?raw=true';
        markerSize = new kakao.maps.Size(27, 27); // 회전형 사이즈
    } else if (category === '고정형') {
        markerImageUrl = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/category2.png?raw=true';
        markerSize = new kakao.maps.Size(27, 27); // 고정형 사이즈
    }

    allPositions.forEach(function(position, index) {
        var showMarker = true;

        if (category === '회전형') {
            showMarker = (allInfo[index] && allInfo[index].rotation >= 1);
        } else if (category === '고정형') {
            showMarker = (allInfo[index] && allInfo[index].fixed >= 1);
        } else if (category !== '전부') {
            showMarker = (position.category === category);
        }

        if (showMarker) {
            var markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
            var markerImage = new kakao.maps.MarkerImage(markerImageUrl, markerSize);
            var marker = new kakao.maps.Marker({
                position: markerPosition,
                image: markerImage
            });
            markers.push(marker);

            // 메인 지도에 마커 추가
            marker.setMap(map);

            // 미니맵에 마커 추가
            var minimapMarker = new kakao.maps.Marker({
                position: markerPosition,
                image: markerImage
            });
            minimapMarkers.push(minimapMarker);
            minimapMarker.setMap(minimap);

            // 마커 클릭 이벤트 설정
            kakao.maps.event.addListener(marker, 'click', function() {
                var markerNumber = allInfo[index].number;

                // 연결된 마커인지 확인
                var baseMarkerNumber = Object.keys(markerConnections).find(function(key) {
                    return markerConnections[key].red.includes(markerNumber) ||
                           markerConnections[key].blue.includes(markerNumber) ||
                           markerConnections[key].black.includes(markerNumber);
                });

                // 연결된 마커 또는 기준 마커가 없으면, 일반 마커로 처리
                if (baseMarkerNumber) {
                    var baseMarkerInfo = allInfo.find(function(info) {
                        return info.number === baseMarkerNumber;
                    });
                    handleMarkerClick(marker, baseMarkerInfo); // 기준 마커로 처리
                } else {
                    // 기준 마커로 설정되지 않은 일반 마커도 처리
                    handleMarkerClick(marker, allInfo[index]); // 클릭한 마커 자체가 기준일 때
                }

                // 커스텀 오버레이 표시
                showCustomOverlay(position, index);
            });

            kakao.maps.event.addListener(marker, 'touchstart', function() {
                handleMarkerClick(marker, markerImageUrl);
                showCustomOverlay(position, index);
            });
        }
    });
}

// 커스텀 오버레이를 닫을 때 마커 이미지를 원래대로 복원
function showCustomOverlay(position, index) {
    closeCustomOverlay();

    var overlayContent =
        '<div class="customOverlay">' +
        '    <span class="closeBtn" onclick="closeCustomOverlay()">×</span>' +
        '    <div class="title">' + position.category + '</div>' +
        '    <div class="desc">' +
        '        <div class="desc-content">' +
        '            <img src="' + allInfo[index].image + '" width="50" height="50">' +
        '            <div>' +
        '                <p>관리번호 : ' + allInfo[index].number + '</p>' +
        '                <p>주소 : ' + allInfo[index].address + '</p>' +
        '                <p>회전형 : ' + allInfo[index].rotation + '</p>' +
        '                <p>고정형 : ' + allInfo[index].fixed + '</p>' +
        '                <p>상세설명 : ' + allInfo[index].description + '</p>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '</div>';

    currentOverlay = new kakao.maps.CustomOverlay({
        content: overlayContent,
        map: map,
        position: new kakao.maps.LatLng(position.lat, position.lng),
        yAnchor: 1.1
    });
}

// 기타 로직 유지

var categoryDropdown = document.getElementById('categoryDropdown');

categories.forEach(function(category) {
    var option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryDropdown.appendChild(option);
});

categoryDropdown.addEventListener('change', function() {
    var selectedCategory = categoryDropdown.value;
    createMarkersAndOverlays(selectedCategory);
});

var newSearchForm = document.getElementById('newSearchForm');
var newSearchInput = document.getElementById('newSearchInput');
var newSearchBtn = document.getElementById('newSearchBtn');

// 문자열 전처리 함수: 하이픈과 공백을 제거
function normalizeString(str) {
    return str.replace(/[-\s]/g, '').toLowerCase();
}

newSearchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    var userInput = normalizeString(newSearchInput.value.trim());
    var position = null;
    var markerIndex = -1;

    // 위도/경도 패턴 검색
    var latLngPattern = /(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/;
    if (latLngPattern.test(userInput)) {
        var match = userInput.match(latLngPattern);
        var lat = parseFloat(match[1]);
        var lng = parseFloat(match[3]);
        position = new kakao.maps.LatLng(lat, lng);

        // 위도/경도가 일치하는 마커 찾기
        allPositions.forEach(function(pos, index) {
            if (pos.lat === lat && pos.lng === lng) {
                markerIndex = index;
                return false;
            }
        });
    } else {
        // 주소 또는 관리번호로 검색
        var filtered = allInfo.filter(function(item) {
            return normalizeString(item.address).includes(userInput) ||
                   normalizeString(item.number).includes(userInput);
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
            // 검색된 마커 클릭 이벤트 트리거
            kakao.maps.event.trigger(markers[markerIndex], 'click');
        } else {
            // 해당 위치에 정보가 없는 경우 임시 마커 생성
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

            // 일정 시간 후 임시 마커 제거
            setTimeout(function() {
                tempMarker.setMap(null);
                tempOverlay.setMap(null);
            }, 3000);
        }
    } else {
        alert('유효한 주소, 위도/경도 또는 관리번호를 입력하세요.');
    }
});

newSearchBtn.addEventListener('click', function() {
    newSearchForm.dispatchEvent(new Event('submit'));
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


// Add this function
function toggleRoadviewMode(isRoadview) {
    const elements = document.querySelectorAll('.roadview');
    elements.forEach(element => {
        element.style.display = isRoadview ? 'none' : 'block';
    });
}

// Modify the existing roadview toggle logic to call toggleRoadviewMode
document.getElementById('roadviewToggle').addEventListener('click', function() {
    const roadviewContainer = document.getElementById('roadview');
    const mapContainer = document.getElementById('map');
    if (roadviewContainer.classList.contains('hidden')) {
        roadviewContainer.classList.remove('hidden');
        mapContainer.classList.add('hidden');
        toggleRoadviewMode(true);
    } else {
        roadviewContainer.classList.add('hidden');
        mapContainer.classList.remove('hidden');
        toggleRoadviewMode(false);
    }
});



kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    if (isRoadviewEnabled) {
        var latlng = mouseEvent.latLng;
        roadviewClient.getNearestPanoId(latlng, 50, function(panoId) {
            if (panoId) {
                roadview.setPanoId(panoId, latlng);
                roadviewContainer.style.display = 'block';
                minimapContainer.style.display = 'block'; // 추가된 코드
                mapContainer.style.display = 'none';
                setTimeout(function() {
                    kakao.maps.event.trigger(minimap, 'resize'); // minimap 강제 리프레시
                    minimap.setCenter(latlng); // minimap 중심 재설정
                }, 0);
            }
        });
    }
});

// Toggle Roadview on/off
function toggleRoadview() {
    isRoadviewEnabled = !isRoadviewEnabled;
    if (isRoadviewEnabled) {
        map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        roadviewContainer.style.display = 'block';
        minimapContainer.style.display = 'block'; // 추가된 코드
        setTimeout(function() {
            minimap.relayout();  // minimap 강제 리프레시
            minimap.setCenter(map.getCenter()); // minimap 중심 재설정
        }, 0);
    } else {
        map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        roadviewContainer.style.display = 'none';
        minimapContainer.style.display = 'none'; // 추가된 코드
        mapContainer.style.display = 'block';
    }
}

var roadviewToggleBtn = document.getElementById('roadviewToggle');
roadviewToggleBtn.addEventListener('click', function() {
    toggleRoadview();
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
