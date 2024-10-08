// 지도 및 로드뷰 관련 변수
var mapContainer = document.getElementById('map');
var roadviewContainer = document.getElementById('roadview');
var minimapMarkers = [];
var isRoadviewEnabled = false;
var polylines = []; // 폴리라인을 저장하는 배열
var lastClickedMarker = null; // 마지막 클릭된 마커 저장
var currentOverlay = null; // 현재 커스텀 오버레이 저장
var isRoadviewInitialized = false;

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

// 마커 클릭 이벤트 및 커스텀 오버레이 처리
function handleMarkerClick(clickedMarker, markerId) {
    if (lastClickedMarker) {
        lastClickedMarker.setImage(new kakao.maps.MarkerImage(defaultMarkerImageUrl, new kakao.maps.Size(30, 40)));
    }

    clickedMarker.setImage(new kakao.maps.MarkerImage(clickedMarkerImageUrl, new kakao.maps.Size(30, 40)));
    lastClickedMarker = clickedMarker;

    // 기존 폴리라인 제거
    clearPolylines();

    // 해당 마커와 연결된 다른 마커들에 대해 폴리라인 생성
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

    // 커스텀 오버레이 표시
    showCustomOverlay(clickedMarker.getPosition(), markers.indexOf(clickedMarker));
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
        clearPolylines();
    }
}

// 커스텀 오버레이 표시
function showCustomOverlay(position, index) {
    closeCustomOverlay();

    var overlayContent = 
        '<div class="customOverlay">' +
        '    <span class="closeBtn" onclick="closeCustomOverlay()">×</span>' +
        '    <div class="title">' + allInfo[index].category + '</div>' +
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

    var markerImageUrl = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'; 
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
