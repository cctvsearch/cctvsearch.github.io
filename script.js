// 지도 및 로드뷰 관련 변수
var mapContainer = document.getElementById('map');
var roadviewContainer = document.getElementById('roadview');
var minimapMarkers = [];
var markers = []; // 마커 저장 배열
var isRoadviewEnabled = false;
var polylines = []; // 폴리라인을 저장하는 배열
var lastClickedMarker = null; // 마지막 클릭된 마커 저장
var currentOverlay = null; // 현재 커스텀 오버레이 저장
var isRoadviewInitialized = false;
var isConnectionModeEnabled = false; // 연결점 모드 상태

const defaultMarkerImageUrl = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'; 
const clickedMarkerImageUrl = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/marker_spot2.png?raw=true';

// 마커 데이터 및 연결 정보
const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

// 각 마커에 대한 연결 정보
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

// 카카오 지도 초기화
var mapOption = {
    center: new kakao.maps.LatLng(37.429504, 126.988322),
    level: 5
};
var map = new kakao.maps.Map(mapContainer, mapOption);
var minimapContainer = document.getElementById('minimap');
var minimap = new kakao.maps.Map(minimapContainer, {
    center: new kakao.maps.LatLng(37.429504, 126.988322),
    level: 3
});
var roadview = new kakao.maps.Roadview(roadviewContainer);
var roadviewClient = new kakao.maps.RoadviewClient();
var geocoder = new kakao.maps.services.Geocoder();

// 로드뷰 초기화 이벤트
kakao.maps.event.addListener(roadview, 'init', function() {
    isRoadviewInitialized = true;
});

// 로드뷰 및 지도 토글 버튼
document.getElementById('roadviewToggle').addEventListener('click', function() {
    if (!isRoadviewInitialized) {
        roadviewClient.getNearestPanoId(map.getCenter(), 50, function(panoId) {
            if (panoId) {
                roadview.setPanoId(panoId, map.getCenter());
                roadview.setViewpoint({ pan: 0, tilt: 0, zoom: 0 });
                isRoadviewInitialized = true; // 초기화 완료 플래그 설정
            }
        });
    }

    if (isRoadviewEnabled) {
        document.getElementById('roadview').style.display = 'none';
        document.getElementById('map').style.display = 'block';
        isRoadviewEnabled = false;
    } else {
        document.getElementById('roadview').style.display = 'block';
        document.getElementById('map').style.display = 'none';
        isRoadviewEnabled = true;
    }
});

// 연결점 버튼 기능 추가
document.getElementById('connectionToggle').addEventListener('click', function() {
    isConnectionModeEnabled = !isConnectionModeEnabled;

    if (isConnectionModeEnabled) {
        this.textContent = '연결점 끄기';
    } else {
        this.textContent = '연결점';
        clearPolylines(); // 연결점 모드 비활성화 시 모든 선 삭제
    }
});

// 마커 클릭 이벤트 및 커스텀 오버레이 처리
function handleMarkerClick(clickedMarker, markerId) {
    // 이전에 클릭한 마커가 있으면 원래 이미지로 되돌림
    if (lastClickedMarker) {
        lastClickedMarker.setImage(new kakao.maps.MarkerImage(defaultMarkerImageUrl, new kakao.maps.Size(30, 40)));
    }

    // 현재 클릭한 마커의 이미지를 변경
    clickedMarker.setImage(new kakao.maps.MarkerImage(clickedMarkerImageUrl, new kakao.maps.Size(30, 40)));
    lastClickedMarker = clickedMarker;

    // 연결점 모드가 활성화된 경우에만 폴리라인 표시
    if (isConnectionModeEnabled) {
        clearPolylines();
        var connections = markerConnections[markerId];
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
        }
    }

    // 커스텀 오버레이 표시
    showCustomOverlay(clickedMarker.getPosition(), markers.indexOf(clickedMarker));
}

// 마커 간의 폴리라인 그리기
function drawPolyline(startMarker, connectedMarkerIds, color) {
    clearPolylines(); // 다른 마커의 선은 삭제
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

// 기존 폴리라인 제거
function clearPolylines() {
    polylines.forEach(function(polyline) {
        polyline.setMap(null);
    });
    polylines = [];
}

// 커스텀 오버레이를 닫을 때 폴리라인도 제거
function closeCustomOverlay() {
    if (currentOverlay) {
        currentOverlay.setMap(null);
        currentOverlay = null;
        if (!isConnectionModeEnabled) {
            clearPolylines(); // 연결점 모드가 활성화되어 있지 않으면 폴리라인 제거
        }
    }
}

// 커스텀 오버레이 표시 (undefined 처리 포함)
function showCustomOverlay(position, index) {
    closeCustomOverlay();

    var info = allInfo[index] || {}; // 값이 없을 경우 빈 객체 반환
    var overlayContent = 
        '<div class="customOverlay">' +
        '    <span class="closeBtn" onclick="closeCustomOverlay()">×</span>' +
        '    <div class="title">' + (info.category || '') + '</div>' +
        '    <div class="desc">' +
        '        <div class="desc-content">' +
        '            <img src="' + (info.image || '') + '" width="50" height="50">' +
        '            <div>' +
        '                <p>관리번호 : ' + (info.number || '') + '</p>' +
        '                <p>주소 : ' + (info.address || '') + '</p>' +
        '                <p>회전형 : ' + (info.rotation || '') + '</p>' +
        '                <p>고정형 : ' + (info.fixed || '') + '</p>' +
        '                <p>상세설명 : ' + (info.description || '') + '</p>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '</div>';

    currentOverlay = new kakao.maps.CustomOverlay({
        content: overlayContent,
        map: map,
        position: position,
        yAnchor: 1.1
    });
}

// 마커 및 오버레이 초기화
createMarkersAndOverlays('전부');

// 마커와 오버레이 생성 함수
function createMarkersAndOverlays(category) {
    // 기존 마커 및 오버레이 제거
    closeCustomOverlay();
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    minimapMarkers.forEach(marker => marker.setMap(null));
    minimapMarkers = [];

    var markerImageUrl = defaultMarkerImageUrl; 
    var markerSize = new kakao.maps.Size(30, 40);

    allPositions.forEach(function(position, index) {
        var showMarker = true;

        if (category !== '전부' && position.category !== category) {
            showMarker = false;
        }

        if (showMarker) {
            var markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
            var markerImage = new kakao.maps.MarkerImage(markerImageUrl, markerSize);
            var marker = new kakao.maps.Marker({
                position: markerPosition,
                image: markerImage
            });

            markers.push(marker);
            marker.setMap(map);

            var minimapMarker = new kakao.maps.Marker({
                position: markerPosition,
                image: markerImage
            });
            minimapMarkers.push(minimapMarker);
            minimapMarker.setMap(minimap);

            kakao.maps.event.addListener(marker, 'click', function() {
                handleMarkerClick(marker, allInfo[index].number);
            });
        }
    });
}

// 검색 기능 복구
var newSearchForm = document.getElementById('newSearchForm');
var newSearchInput = document.getElementById('newSearchInput');

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
        map.setLevel(4); // 확대 수준 설정

        // 검색된 마커 클릭 이벤트 트리거
        if (markerIndex !== -1) {
            kakao.maps.event.trigger(markers[markerIndex], 'click');
        } else {
            // 위치 정보가 없을 경우 임시 마커 및 오버레이 생성
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
                yAnchor: 2.0
            });

            // 일정 시간 후 임시 마커 제거
            setTimeout(function() {
                tempMarker.setMap(null);
                tempOverlay.setMap(null);
            }, 3000);
        }
    }
});
