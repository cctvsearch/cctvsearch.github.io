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

// 미니맵을 생성합니다.
var minimapContainer = document.getElementById('minimap');
var minimap = new kakao.maps.Map(minimapContainer, {
    center: new kakao.maps.LatLng(37.4295040000, 126.9883220000),
    level: 3
});

kakao.maps.event.addListener(roadview, 'init', function() {
    var mapWalker = new MapWalker(map.getCenter());
    mapWalker.setMap(minimap);

    kakao.maps.event.addListener(roadview, 'viewpoint_changed', function() {
        var viewpoint = roadview.getViewpoint();
        mapWalker.setAngle(viewpoint.pan);
    });

    kakao.maps.event.addListener(roadview, 'position_changed', function() {
        var position = roadview.getPosition();
        mapWalker.setPosition(position);
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

function createMarkersAndOverlays(category) {
    closeCustomOverlay();

    // 기존 마커 제거
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];

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

            kakao.maps.event.addListener(marker, 'click', function() {
                showCustomOverlay(position, index);
            });

            kakao.maps.event.addListener(marker, 'touchstart', function() {
                showCustomOverlay(position, index);
            });

            marker.setMap(map);
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
        yAnchor: 1.1
    });
}

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
            }
        });
    } else {
        var keyword = userInput.toLowerCase();
        allInfo.forEach(function(info, index) {
            if (info && info.address && info.address.toLowerCase().includes(keyword)) {
                var pos = allPositions[index];
                position = new kakao.maps.LatLng(pos.lat, pos.lng);
                markerIndex = index;
            }
        });
    }

    if (position) {
        map.setCenter(position);
        if (markerIndex !== -1) {
            showCustomOverlay(allPositions[markerIndex], markerIndex);
        }
    }
});

kakao.maps.event.addListener(map, 'click', function(event) {
    if (isLatLngClickMode) {
        var latLng = event.latLng;
        if (tempOverlay) {
            tempOverlay.setMap(null);
        }
        tempOverlay = new kakao.maps.CustomOverlay({
            content: '<div class="customOverlay">' +
                '    <span class="closeBtn" onclick="closeCustomOverlay()">×</span>' +
                '    <div class="title">위도: ' + latLng.getLat() + '</div>' +
                '    <div class="desc">경도: ' + latLng.getLng() + '</div>' +
                '</div>',
            map: map,
            position: latLng,
            yAnchor: 1
        });
        tempOverlay.setMap(map);
    }
});

document.getElementById('toggleLatLngMode').addEventListener('click', function() {
    isLatLngClickMode = !isLatLngClickMode;
    this.textContent = isLatLngClickMode ? '위도/경도 모드 끄기' : '위도/경도 모드 켜기';
});

// Roadview 토글 버튼 이벤트 리스너 추가
document.getElementById('toggleRoadview').addEventListener('click', function() {
    isRoadviewEnabled = !isRoadviewEnabled;

    if (isRoadviewEnabled) {
        roadviewContainer.style.display = 'block';
        minimapContainer.style.display = 'block';
        mapContainer.classList.add('roadview-active');
    } else {
        roadviewContainer.style.display = 'none';
        minimapContainer.style.display = 'none';
        mapContainer.classList.remove('roadview-active');
    }
});
