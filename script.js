// MapWalker 클래스 정의
function MapWalker(position) {
    var content = document.createElement('div');
    var figure = document.createElement('div');
    var angleBack = document.createElement('div');

    content.className = 'MapWalker';
    figure.className = 'figure';
    angleBack.className = 'angleBack';

    content.appendChild(angleBack);
    content.appendChild(figure);

    var walker = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
    });

    this.walker = walker;
    this.content = content;
}

MapWalker.prototype.setAngle = function(angle) {
    var threshold = 22.5;
    for (var i = 0; i < 16; i++) {
        if (angle > (threshold * i) && angle < (threshold * (i + 1))) {
            var className = 'm' + i;
            this.content.className = this.content.className.split(' ')[0];
            this.content.className += (' ' + className);
            break;
        }
    }
};

MapWalker.prototype.setPosition = function(position) {
    this.walker.setPosition(position);
};

MapWalker.prototype.setMap = function(map) {
    this.walker.setMap(map);
};

// 지도 및 로드뷰 초기화
var mapContainer = document.getElementById('map');
var mapCenter = new kakao.maps.LatLng(33.450701, 126.570667);
var mapOption = {
    center: mapCenter,
    level: 3
};

var map = new kakao.maps.Map(mapContainer, mapOption);
map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);

var roadviewContainer = document.getElementById('roadview');
var roadview = new kakao.maps.Roadview(roadviewContainer);
var roadviewClient = new kakao.maps.RoadviewClient();

roadviewClient.getNearestPanoId(mapCenter, 50, function(panoId) {
    roadview.setPanoId(panoId, mapCenter);
});

var mapWalker = null;

kakao.maps.event.addListener(roadview, 'init', function() {
    mapWalker = new MapWalker(mapCenter);
    mapWalker.setMap(map);

    kakao.maps.event.addListener(roadview, 'viewpoint_changed', function() {
        var viewpoint = roadview.getViewpoint();
        mapWalker.setAngle(viewpoint.pan);
    });

    kakao.maps.event.addListener(roadview, 'position_changed', function() {
        var position = roadview.getPosition();
        mapWalker.setPosition(position);
        map.setCenter(position);
    });
});

var mapWrapper = document.getElementById('mapWrapper');
var rvClient = new kakao.maps.RoadviewClient();

toggleRoadview(mapCenter);

var markImage = new kakao.maps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/2018/pc/roadview_minimap_wk_2018.png',
    new kakao.maps.Size(26, 46),
    {
        spriteSize: new kakao.maps.Size(1666, 168),
        spriteOrigin: new kakao.maps.Point(705, 114),
        offset: new kakao.maps.Point(13, 46)
    }
);

var rvMarker = new kakao.maps.Marker({
    image: markImage,
    position: mapCenter,
    draggable: true,
    map: map
});

kakao.maps.event.addListener(rvMarker, 'dragend', function(mouseEvent) {
    var position = rvMarker.getPosition();
    toggleRoadview(position);
});

kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    var position = mouseEvent.latLng;
    rvMarker.setPosition(position);
    toggleRoadview(position);
});

function toggleRoadview(position) {
    rvClient.getNearestPanoId(position, 50, function(panoId) {
        if (panoId === null) {
            roadviewContainer.style.display = 'none';
            mapWrapper.style.width = '100%';
            map.relayout();
        } else {
            mapWrapper.style.width = '50%';
            map.relayout();
            roadviewContainer.style.display = 'block';
            roadview.setPanoId(panoId, position);
            roadview.relayout();
        }
    });
}

// 기존 JavaScript 기능 추가
document.getElementById('newSearchBtn').addEventListener('click', function() {
    var input = document.getElementById('newSearchInput').value;
    // 위도/경도 또는 관리번호 입력 처리 코드 추가
});

document.getElementById('latLngButton').addEventListener('click', function() {
    // 위도/경도 버튼 클릭 처리 코드 추가
});

document.getElementById('roadviewToggle').addEventListener('click', function() {
    // 로드뷰 토글 버튼 클릭 처리 코드 추가
});

document.getElementById('currentPosButton').addEventListener('click', function() {
    // 현재 위치 버튼 클릭 처리 코드 추가
});
