const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

var mapContainer = document.getElementById('map');
var mapOption = {
    center: new kakao.maps.LatLng(37.4295040000, 126.9883220000),
    level: 5
};
var map = new kakao.maps.Map(mapContainer, mapOption);

// 지도와 로드뷰 인스턴스 초기화
var roadviewContainer = document.getElementById('roadview');
var roadview = new kakao.maps.Roadview(roadviewContainer);
var roadviewClient = new kakao.maps.RoadviewClient();

kakao.maps.event.addListener(map, 'idle', function() {
    if (roadviewContainer.style.display === 'block') {
        var position = map.getCenter();
        roadviewClient.getNearestPanoId(position, 50, function(panoId) {
            if (panoId) {
                roadview.setPanoId(panoId, position);
            }
        });
    }
});

// 지도 위에 현재 로드뷰의 위치와 각도를 표시하기 위한 map walker 아이콘 생성 클래스
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

var mapWalker = null;

// 로드뷰 초기화 후 map walker 생성
kakao.maps.event.addListener(roadview, 'init', function() {
    mapWalker = new MapWalker(map.getCenter());
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

var categories = ['갈현동', '과천동', '문원동', '별양동', '부림동', '주암동', '중앙동', '기타', '회전형', '고정형', '전부'];

var markers = [];
var currentOverlay = null;
var isLatLngClickMode = false;
var tempOverlay = null;

createMarkersAndOverlays('전부');

function createMarkersAndOverlays(category) {
    closeCustomOverlay();

    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];

    var markerImageUrl = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png';
    var markerSize = new kakao.maps.Size(30, 40);

    if (category === '회전형') {
        markerImageUrl = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/category1.png?raw=true';
        markerSize = new kakao.maps.Size(27, 27);
    } else if (category === '고정형') {
        markerImageUrl = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/category2.png?raw=true';
        markerSize = new kakao.maps.Size(27, 27);
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
        }
    }
});

document.getElementById('searchByLatLng').addEventListener('click', function() {
    isLatLngClickMode = true;
});

document.getElementById('searchByNumber').addEventListener('click', function() {
    isLatLngClickMode = false;
});

var overlayOn = false;
var container = document.getElementById('container');

function toggleOverlay(active) {
    if (active) {
        overlayOn = true;
        map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        marker.setMap(map);
        marker.setPosition(map.getCenter());
        toggleRoadview(map.getCenter());
    } else {
        overlayOn = false;
        map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        marker.setMap(null);
    }
}

function toggleRoadview(position) {
    roadviewClient.getNearestPanoId(position, 50, function(panoId) {
        if (panoId === null) {
            toggleMapWrapper(true, position);
        } else {
            toggleMapWrapper(false, position);
            roadview.setPanoId(panoId, position);
        }
    });
}

function toggleMapWrapper(active, position) {
    if (active) {
        container.className = '';
        map.relayout();
        map.setCenter(position);
    } else {
        if (container.className.indexOf('view_roadview') === -1) {
            container.className = 'view_roadview';
            map.relayout();
            map.setCenter(position);
        }
    }
}

function setRoadviewRoad() {
    var control = document.getElementById('roadviewControl');
    if (control.className.indexOf('active') === -1) {
        control.className = 'active';
        toggleOverlay(true);
    } else {
        control.className = '';
        toggleOverlay(false);
    }
}

function closeRoadview() {
    var position = marker.getPosition();
    toggleMapWrapper(true, position);
}

document.getElementById('latLngButton').addEventListener('click', function() {
    var center = map.getCenter();
    alert('현재 지도 중심의 위도는 ' + center.getLat() + ' 이고, 경도는 ' + center.getLng() + ' 입니다');
});

document.getElementById('roadviewToggle').addEventListener('click', function() {
    setRoadviewRoad();
});

document.getElementById('searchByLatLng').addEventListener('click', function() {
    isLatLngClickMode = true;
});

document.getElementById('searchByNumber').addEventListener('click', function() {
    isLatLngClickMode = false;
});
