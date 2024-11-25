const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

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
var lastClickedMarker = null; // Store the last clicked marker

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
    var markerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'; // 기본 이미지
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

            // 마커 클릭 이벤트 추가
            kakao.maps.event.addListener(marker, 'click', function() {
                handleMarkerClick(marker, markerImageUrl);
                showCustomOverlay(position, index);
            });

            kakao.maps.event.addListener(marker, 'touchstart', function() {
                handleMarkerClick(marker, markerImageUrl);
                showCustomOverlay(position, index);
            });
        }
    });
}

function handleMarkerClick(clickedMarker, defaultImageUrl) {
    // 이전에 클릭한 마커가 있으면 원래 이미지로 되돌림
    if (lastClickedMarker) {
        lastClickedMarker.setImage(new kakao.maps.MarkerImage(defaultImageUrl, new kakao.maps.Size(30, 40)));
    }

    // 현재 클릭한 마커의 이미지를 변경
    clickedMarker.setImage(new kakao.maps.MarkerImage(clickedMarkerImageUrl, new kakao.maps.Size(30, 40)));

    // 마지막으로 클릭된 마커를 현재 마커로 설정
    lastClickedMarker = clickedMarker;
}

// 커스텀 오버레이를 닫을 때 마커 이미지를 원래대로 복원
function closeCustomOverlay() {
    if (currentOverlay && typeof currentOverlay.setMap === "function") {
        currentOverlay.setMap(null);
        currentOverlay = null;
    }

    if (lastClickedMarker && typeof lastClickedMarker.setImage === "function") {
        const defaultImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png';
        lastClickedMarker.setImage(new kakao.maps.MarkerImage(defaultImageUrl, new kakao.maps.Size(30, 40)));
        lastClickedMarker = null; // 초기화
    }
}

function showCustomOverlay(position, index) {
    closeCustomOverlay(); // 기존 오버레이 닫기

    const overlayContent = `
        <div class="customOverlay">
            <span class="closeBtn" onclick="closeCustomOverlay()">×</span>
            <div class="title">${position.category}</div>
            <div class="desc">
                <div class="desc-content">
                    <div>
                        <p><strong>관리번호:</strong> ${allInfo[index].number}</p>
                        <p><strong>주소:</strong> ${allInfo[index].address}</p>
                        <p><strong>회전형:</strong> ${allInfo[index].rotation}</p>
                        <p><strong>고정형:</strong> ${allInfo[index].fixed}</p>
                        <p><strong>상세설명:</strong> ${allInfo[index].description}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

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


// Firestore에 새 마커 추가하는 함수
async function addMarkerToFirestore(lat, lng, number, address, rotation, fixed, description, category) {
    try {
        await window.addDoc(window.collection(window.db, "markers"), {
            latitude: lat,
            longitude: lng,
            number: number,
            address: address,
            rotation: rotation,
            fixed: fixed,
            description: description,
            category: category
        });
        alert("마커가 성공적으로 추가되었습니다.");
    } catch (error) {
        console.error("마커 추가 중 오류 발생:", error);
    }
}

// Firestore에서 실시간으로 마커 데이터를 수신하는 함수
function listenForMarkerUpdates() {
    const markersCollection = window.collection(window.db, "markers");

    // Firestore에서 데이터 수신
    window.onSnapshot(markersCollection, (snapshot) => {
        firebaseMarkers.forEach(marker => marker.setMap(null)); // 기존 Firebase 마커 제거
        firebaseMarkers = []; // 배열 초기화

        snapshot.forEach(doc => {
            const data = doc.data();

            // 선택된 카테고리와 비교하여 필터링
            if (selectedCategory !== '전부' && data.category !== selectedCategory) {
                return; // 선택된 카테고리에 맞지 않는 경우 건너뛰기
            }

            const markerPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
            const markerImage = new kakao.maps.MarkerImage(
                "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png",
                new kakao.maps.Size(30, 40)
            );

            const marker = new kakao.maps.Marker({
                position: markerPosition,
                image: markerImage,
                map: map
            });

            // 마커 클릭 이벤트 추가
            kakao.maps.event.addListener(marker, 'click', () => {
                closeCustomOverlay(); // 기존 오버레이 닫기
                showCustomOverlay({
                    lat: data.latitude,
                    lng: data.longitude,
                    category: data.category
                }, {
                    number: data.number,
                    address: data.address,
                    rotation: data.rotation,
                    fixed: data.fixed,
                    description: data.description
                });
            });

            firebaseMarkers.push(marker); // Firebase 마커 저장
        });
    });
}

function showCustomOverlay(position, info) {
    closeCustomOverlay(); // 기존 오버레이 닫기

    const overlayContent = `
        <div class="customOverlay">
            <span class="closeBtn" onclick="closeCustomOverlay()">×</span>
            <div class="title">${position.category}</div>
            <div class="desc">
                <div class="desc-content">
                    <div>
                        <p><strong>관리번호:</strong> ${info.number}</p>
                        <p><strong>주소:</strong> ${info.address}</p>
                        <p><strong>회전형:</strong> ${info.rotation}</p>
                        <p><strong>고정형:</strong> ${info.fixed}</p>
                        <p><strong>상세설명:</strong> ${info.description}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    currentOverlay = new kakao.maps.CustomOverlay({
        content: overlayContent,
        map: map,
        position: new kakao.maps.LatLng(position.lat, position.lng),
        yAnchor: 1.1
    });
}


document.addEventListener('DOMContentLoaded', function() {
    // 지도 초기화, 중복 실행 방지
    if (!map) {
        const mapOption = {
            center: new kakao.maps.LatLng(37.566535, 126.9779692),
            level: 5
        };
        map = new kakao.maps.Map(document.getElementById('map'), mapOption);
    }

    // 기존 데이터 표시
    createMarkersAndOverlays('전부');

    // Firestore 실시간 업데이트 수신
    listenForMarkerUpdates();

    // 마커 추가 버튼 클릭 시 폼 표시
    document.getElementById('addMarkerButton').addEventListener('click', function() {
        document.getElementById('addMarkerForm').style.display = 'block';
    });

    // 닫기 버튼 클릭 시 폼 숨기기
    document.getElementById('closeMarkerFormButton').addEventListener('click', function() {
        document.getElementById('addMarkerForm').style.display = 'none';
    });

    // submitMarkerButton 클릭 시 Firestore에 데이터 저장
    document.getElementById('submitMarkerButton').addEventListener('click', async function() {
    const lat = parseFloat(document.getElementById('latitudeInput').value);
    const lng = parseFloat(document.getElementById('longitudeInput').value);
    const number = document.getElementById('numberInput').value;
    const address = document.getElementById('addressInput').value;
    const rotation = parseInt(document.getElementById('rotationInput').value);
    const fixed = parseInt(document.getElementById('fixedInput').value);
    const description = document.getElementById('descriptionInput').value;
    const category = document.getElementById('categoryInput').value; // 카테고리 값 읽기 추가

    // Firestore에 마커 데이터 추가
    try {
        await addMarkerToFirestore(lat, lng, number, address, rotation, fixed, description, category); // 카테고리 전달
        alert("마커가 성공적으로 추가되었습니다.");

        // 폼 숨기기 및 초기화
        document.getElementById('addMarkerForm').style.display = 'none';
        document.getElementById('latitudeInput').value = '';
        document.getElementById('longitudeInput').value = '';
        document.getElementById('numberInput').value = '';
        document.getElementById('addressInput').value = '';
        document.getElementById('rotationInput').value = '';
        document.getElementById('fixedInput').value = '';
        document.getElementById('descriptionInput').value = '';
        document.getElementById('categoryInput').value = '갈현동'; // 기본값으로 초기화
    } catch (error) {
        console.error("마커 추가 중 오류 발생:", error);
        alert("마커 추가 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
});
});

// Firebase 데이터와 로컬 데이터의 카테고리 필터링을 통합

var selectedCategory = '전부'; // 기본값
var firebaseMarkers = []; // Firebase에서 생성된 마커 저장 배열

function listenForMarkerUpdates() {
    const markersCollection = window.collection(window.db, "markers");

    window.onSnapshot(markersCollection, (snapshot) => {
        firebaseMarkers.forEach(marker => marker.setMap(null)); // 기존 Firebase 마커 제거
        firebaseMarkers = []; // 배열 초기화

        snapshot.forEach(doc => {
            const data = doc.data();

            // 선택된 카테고리와 비교하여 필터링
            if (selectedCategory !== '전부' && data.category !== selectedCategory) {
                return; // 선택된 카테고리에 맞지 않는 경우 건너뛰기
            }

            const markerPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
            const markerImage = new kakao.maps.MarkerImage(
                "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png",
                new kakao.maps.Size(30, 40)
            );

            const marker = new kakao.maps.Marker({
                position: markerPosition,
                image: markerImage,
                map: map
            });

            firebaseMarkers.push(marker); // Firebase 마커 저장
        });
    });
}

// 드롭다운 이벤트 리스너
document.getElementById('categoryDropdown').addEventListener('change', function() {
    selectedCategory = this.value;

    // 로컬 데이터와 Firebase 데이터 모두 필터링
    createMarkersAndOverlays(selectedCategory);
    listenForMarkerUpdates();
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    selectedCategory = '전부'; // 기본 카테고리 설정
    createMarkersAndOverlays(selectedCategory);
    listenForMarkerUpdates();
});

