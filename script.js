// 카테고리별 데이터를 모두 불러옵니다.
const allPositions = Apositions.concat(Bpositions, Cpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

var mapContainer = document.getElementById('map');
var mapOption = {
    center: new kakao.maps.LatLng(37.4295040000, 126.9883220000),
    level: 5
};
var map = new kakao.maps.Map(mapContainer, mapOption);

var roadviewContainer = document.getElementById('roadview'); // 로드뷰 컨테이너
var roadview = new kakao.maps.Roadview(roadviewContainer); // 로드뷰 객체
var roadviewClient = new kakao.maps.RoadviewClient(); // 로드뷰 클라이언트

var categories = ['갈현동', '과천동', '문원동', '별양동', '부림동', '주암동', '중앙동', '기타', '회전형', '고정형', '전부'];

var markers = [];
var currentOverlay = null;
var isLatLngClickMode = false; // 위도와 경도를 표시하는 모드인지 확인하는 플래그
var tempOverlay = null; // 임시 오버레이를 저장할 변수
var isRoadviewMode = false; // 로드뷰 모드 플래그

// 전체 코드는 다음과 같이 수정됩니다.
// 기존 코드의 일부만 표시합니다. 전체 코드를 한 번에 통합하고 실행해야 합니다.

// 모든 마커와 오버레이를 표시합니다.
createMarkersAndOverlays('전부');

// 로드뷰 모드 토글 버튼 이벤트 리스너 추가
document.getElementById('toggleRoadviewBtn').addEventListener('click', function() {
    isRoadviewMode = !isRoadviewMode;
    if (isRoadviewMode) {
        document.getElementById('map').classList.add('minimized');
        document.getElementById('roadview').classList.remove('hidden');
        document.getElementById('toggleRoadviewBtn').textContent = '지도 보기';
        setRoadview(map.getCenter()); // 현재 중심점을 로드뷰로 설정
    } else {
        document.getElementById('map').classList.remove('minimized');
        document.getElementById('roadview').classList.add('hidden');
        document.getElementById('toggleRoadviewBtn').textContent = '로드뷰 보기';
    }
});

function setRoadview(latLng) {
    roadviewClient.getNearestPanoId(latLng, 50, function(panoId) {
        roadview.setPanoId(panoId);
        roadview.setViewpoint({ pan: 0, tilt: 0, zoom: 0 });
    });
}

function createMarkersAndOverlays(category) {
    closeCustomOverlay(); // 현재 열려 있는 커스텀 오버레이 닫기
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];

    allPositions.forEach(function(position, index) {
        var showMarker = true;

        // 회전형 카테고리 조건 설정
        if (category === '회전형') {
            if (allInfo[index].rotation < 1) {
                showMarker = false;
            }
        }
        // 고정형 카테고리 조건 설정
        else if (category === '고정형') {
            if (allInfo[index].fixed < 1) {
                showMarker = false;
            }
        }

        // 선택된 카테고리 또는 전체 카테고리인 경우 마커 생성
        if (category === '전부' || position.category === category) {
            if (showMarker) {
                var markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
                var markerImage = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'; // 기본 마커 이미지

                var marker = new kakao.maps.Marker({
                    position: markerPosition,
                    image: new kakao.maps.MarkerImage(markerImage, new kakao.maps.Size(30, 40)) // 기본 마커 이미지 크기 설정
                });
                markers.push(marker);

                kakao.maps.event.addListener(marker, 'click', function() {
                    showCustomOverlay(position, index);
                });

                // 모바일 터치 이벤트 처리 추가
                kakao.maps.event.addListener(marker, 'touchstart', function() {
                    showCustomOverlay(position, index);
                });

                marker.setMap(map);
            }
        }
    });
}

function closeCustomOverlay() {
    if (currentOverlay) {
        currentOverlay.setMap(null);
        currentOverlay = null;
    }
}

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
        yAnchor: 1.1 // 중앙 정렬(0.5)에서 위쪽으로 조정하여 닫기 버튼이 가려지지 않게 함
    });
}

var categoryDropdown = document.getElementById('categoryDropdown');

// 드롭다운 형식의 카테고리 목록 생성 및 클릭 이벤트 추가
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

// 새로운 검색창 요소들 가져오기
var newSearchForm = document.getElementById('newSearchForm');
var newSearchInput = document.getElementById('newSearchInput');
var newSearchBtn = document.getElementById('newSearchBtn');

// 검색 이벤트 리스너 추가
newSearchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    var userInput = newSearchInput.value.trim();

    var position = null;
    var markerIndex = -1;

    // 위도/경도 형식 확인
    var latLngPattern = /(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/;
    if (latLngPattern.test(userInput)) {
        var match = userInput.match(latLngPattern);
        var lat = parseFloat(match[1]);
        var lng = parseFloat(match[3]);
        position = new kakao.maps.LatLng(lat, lng);

        // 위도와 경도로 마커 찾기
        allPositions.forEach(function(pos, index) {
            if (pos.lat === lat && pos.lng === lng) {
                markerIndex = index;
                return false; // 루프 종료
            }
        });
    } else {
        // 관리번호 검색
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
        map.setLevel(4); // 필요에 따라 줌 레벨을 조정

        // 모든 마커를 다시 그리기
        createMarkersAndOverlays('전부');

        // 검색된 위치의 마커가 클릭된 것처럼 커스텀 오버레이 표시
        if (markerIndex !== -1) {
            kakao.maps.event.trigger(markers[markerIndex], 'click');
        } else {
            // 해당 위치에 마커가 없는 경우, 임시 마커 생성 및 오버레이 표시
            var tempMarker = new kakao.maps.Marker({
                position: position,
                map: map
            });

            var tempOverlayContent =
                '<div class="customOverlay">' +
                '    <span class="closeBtn" onclick="closeTempOverlay()">×</span>' +
                '    해당 위치에 정보가 없습니다.' +
                '</div>';

            var tempOverlay = new kakao.maps.CustomOverlay({
                content: tempOverlayContent,
                map: map,
                position: position,
                yAnchor: 1.1 // 중앙 정렬(0.5)에서 위쪽으로 조정하여 닫기 버튼이 가려지지 않게 함
            });

            // 3초 후에 임시 마커와 오버레이 제거
            setTimeout(function() {
                tempMarker.setMap(null);
                tempOverlay.setMap(null);
            }, 3000);
        }
    } else {
        alert('유효한 위도/경도 또는 관리번호를 입력하세요.');
    }
});

// 검색 버튼 클릭 시 검색 이벤트 실행
newSearchBtn.addEventListener('click', function() {
    newSearchForm.dispatchEvent(new Event('submit'));
});

// 임시 오버레이 닫기 함수
function closeTempOverlay() {
    if (tempOverlay) {
        tempOverlay.setMap(null);
        tempOverlay = null;
    }
}

// 버튼 요소 가져오기
var latLngButton = document.createElement('button');
latLngButton.textContent = '위도/경도 찾기';
latLngButton.style.position = 'absolute';
latLngButton.style.top = '45px';
latLngButton.style.left = '10px';
latLngButton.style.zIndex = '2';
latLngButton.style.padding = '10px';
latLngButton.style.backgroundColor = '#007BFF';
latLngButton.style.color = '#fff';
latLngButton.style.border = 'none';
latLngButton.style.cursor = 'pointer';
document.body.appendChild(latLngButton);

// 위도/경도 모드 버튼 클릭 이벤트 추가
latLngButton.addEventListener('click', function() {
    isLatLngClickMode = !isLatLngClickMode;
    if (isLatLngClickMode) {
        latLngButton.textContent = '위도/경도 입력 모드 종료';
        map.setClickable(true); // 클릭 가능하게 설정
    } else {
        latLngButton.textContent = '위도/경도 찾기';
        map.setClickable(false); // 클릭 불가능하게 설정
    }
});

// 지도 클릭 시 위도/경도 가져오기
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    if (isLatLngClickMode) {
        var latlng = mouseEvent.latLng;
        alert('위도: ' + latlng.getLat() + ', 경도: ' + latlng.getLng());
    }
});
