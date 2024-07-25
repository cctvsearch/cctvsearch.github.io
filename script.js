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

// 전역 변수
var mapContainer = document.getElementById('map');
var roadviewContainer = document.getElementById('roadview');
var map;
var roadview;
var roadviewClient;
var mapWalker = null;
var markers = [];
var currentOverlay = null;
var isLatLngClickMode = false;
var tempOverlay = null;

// 데이터를 저장하는 배열
const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

// 초기화 함수
function initialize() {
    // 맵 생성
    var mapOption = {
        center: new kakao.maps.LatLng(37.4295040000, 126.9883220000),
        level: 5
    };
    map = new kakao.maps.Map(mapContainer, mapOption);

    // 로드뷰 생성
    roadview = new kakao.maps.Roadview(roadviewContainer);
    roadviewClient = new kakao.maps.RoadviewClient();

    // 로드뷰 초기화
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

    // 로드뷰 토글 버튼 이벤트
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

    // 초기 로드뷰 토글 상태 설정
    updateButtonText();

    // 위치 가져오기 버튼
    var currentPosButton = document.createElement('button');
    currentPosButton.id = 'currentPosButton';
    var img = document.createElement('img');
    img.src = 'https://github.com/cctvsearch/cctvsearch.github.io/blob/main/image/maker.png?raw=true';
    currentPosButton.appendChild(img);
    document.body.appendChild(currentPosButton);

    // 현재 위치 버튼 클릭 이벤트
    currentPosButton.addEventListener('click', getCurrentPos);

    // 카테고리 드롭다운
    var categoryDropdown = document.getElementById('categoryDropdown');
    var categories = ['갈현동', '과천동', '문원동', '별양동', '부림동', '주암동', '중앙동', '기타', '회전형', '고정형', '전부'];

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

    // 새 검색 폼
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

    function toggleRoadview() {
        if (roadviewContainer.style.display === 'none') {
            roadviewContainer.style.display = 'block';
            mapContainer.style.display = 'none';
            map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        } else {
            roadviewContainer.style.display = 'none';
            mapContainer.style.display = 'block';
            map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        }
        map.relayout();
    }

    function updateButtonText() {
        const latLngButton = document.getElementById('latLngButton');
        const roadviewToggle = document.getElementById('roadviewToggle');

        if (window.innerWidth <= 728) {
            latLngButton.textContent = '좌표';
            roadviewToggle.textContent = (roadviewContainer.style.display === 'none') ? '로드뷰 보기' : '로드뷰 닫기';
        } else {
            latLngButton.textContent = '좌표';
            roadviewToggle.textContent = (roadviewContainer.style.display === 'none') ? '로드뷰 보기' : '로드뷰 닫기';
        }
    }

    window.addEventListener('load', updateButtonText);
    window.addEventListener('resize', updateButtonText);

    createMarkersAndOverlays('전부');
}

// 마커와 오버레이 생성 함수
function createMarkersAndOverlays(category) {
    // 기존 마커 제거
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

    var showMarker;

    if (category === '전부') {
        allPositions.forEach(function(position, index) {
            createMarker(position, allInfo[index]);
        });
    } else {
        allPositions.forEach(function(position, index) {
            if (category === '회전형') {
                showMarker = (allInfo[index] && allInfo[index].rotation >= 1);
            } else if (category === '고정형') {
                showMarker = (allInfo[index] && allInfo[index].fixed >= 1);
            } else {
                showMarker = (position.category === category);
            }

            if (showMarker) {
                createMarker(position, allInfo[index]);
            }
        });
    }
}

function createMarker(position, info) {
    var markerImage = new kakao.maps.MarkerImage('markerImageUrl', new kakao.maps.Size(30, 40));
    var marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(position.lat, position.lng),
        image: markerImage,
        map: map
    });

    kakao.maps.event.addListener(marker, 'click', function() {
        if (currentOverlay) {
            currentOverlay.setMap(null);
        }

        var overlayContent =
            '<div class="customOverlay">' +
            '    <span class="closeBtn" onclick="closeOverlay()">×</span>' +
            '    <div class="overlayContent">' +
            '        <h4>' + info.title + '</h4>' +
            '        <p>' + info.description + '</p>' +
            '    </div>' +
            '</div>';

        currentOverlay = new kakao.maps.CustomOverlay({
            content: overlayContent,
            map: map,
            position: marker.getPosition(),
            yAnchor: 2.0
        });
    });

    markers.push(marker);
}

function closeOverlay() {
    if (currentOverlay) {
        currentOverlay.setMap(null);
        currentOverlay = null;
    }
}

function getCurrentPos() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var currentPosition = new kakao.maps.LatLng(lat, lng);

            map.setCenter(currentPosition);
            map.setLevel(4);

            var message = '<div style="height: 25px; padding:2px 10px; margin: 3px;">현재 위치입니다.</div>';
            displayMarker(currentPosition, message);
        }, function(error) {
            console.error('위치 정보를 가져오는 데 실패했습니다.', error);
        });
    } else {
        alert('Geolocation이 지원되지 않습니다.');
    }
}

function displayMarker(locPosition, message) {
    var marker = new kakao.maps.Marker({
        map: map,
        position: locPosition
    });

    var infowindow = new kakao.maps.InfoWindow({
        content: message,
        removable: true
    });
    infowindow.open(map, marker);

    setTimeout(function() {
        marker.setMap(null);
        infowindow.close();
    }, 3000);
}
