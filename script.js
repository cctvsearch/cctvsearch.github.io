// Firebase 앱 재사용
const auth = window.auth;
const db = window.db;

// 🔹 Firebase 초기화 확인 및 실행 (수정됨)
document.addEventListener("DOMContentLoaded", function () {
    if (!window.auth || !window.db) {
        console.error("Firebase가 아직 초기화되지 않았습니다. 1초 후 재시도...");
        setTimeout(() => {
            if (window.auth && window.db) {
                console.log("✅ Firebase 초기화 완료");
                initializeAuthStateListener();
                listenForMarkerUpdates();
            } else {
                console.error("❌ Firebase 초기화 실패. 페이지를 새로고침하세요.");
            }
        }, 1000);
    } else {
        console.log("✅ Firebase 초기화됨");
        initializeAuthStateListener();
        listenForMarkerUpdates();
    }
});

// 🔹 사용자 인증 상태 확인 (기존 코드 수정됨)
function initializeAuthStateListener() {
    if (!window.auth) {
        console.error("❌ Firebase Auth가 초기화되지 않았습니다.");
        return;
    }

    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("✅ 로그인된 사용자 UID:", user.uid);
            try {
                const userDoc = await window.db.collection("users").doc(user.uid).get();
                if (userDoc.exists && userDoc.data().role === "admin") {
                    console.log("✅ 관리자 확인됨. 지도 표시 시작");
                    renderMap(); // 지도 표시 함수 호출
                } else {
                    alert("❌ 관리자 권한이 필요합니다.");
                    window.auth.signOut();
                    window.location.href = "/login.html"; // 로그인 페이지로 리디렉션
                }
            } catch (error) {
                console.error("❌ 사용자 데이터 가져오기 실패:", error);
                alert("오류 발생. 다시 로그인하세요.");
                window.auth.signOut();
                window.location.href = "/login.html";
            }
        } else {
            console.log("🚫 로그인되지 않음. 로그인 페이지로 이동");
            window.location.href = "/login.html";
        }
    });
}

// 🔹 Firestore에서 마커 업데이트를 수신하는 함수 (기존 코드 수정됨)
function listenForMarkerUpdates() {
    if (!window.db) {
        console.error("❌ Firestore가 아직 초기화되지 않았습니다.");
        return;
    }

    const markersCollection = window.db.collection("markers");

    markersCollection.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                console.log("🆕 새로운 마커 추가됨:", data);

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
                kakao.maps.event.addListener(marker, 'click', function () {
                    console.log("📍 마커 클릭됨:", data);
                });
            }
        });
    });
}

// 기존의 Firestore 인증 확인 로직 (유지됨)
if (auth) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("로그인된 사용자 UID:", user.uid);

            try {
                const userDoc = await db.collection("users").doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.role === "admin") {
                        console.log("관리자 권한 확인됨. 지도 표시를 시작합니다.");
                        renderMap();
                    } else {
                        console.error("관리자 권한이 아닙니다. 접근이 차단됩니다.");
                        alert("관리자 권한이 필요합니다. 다시 로그인하세요.");
                        auth.signOut(); // 로그아웃
                        window.location.href = "/login.html"; // 로그인 페이지로 리디렉션
                    }
                } else {
                    console.error("사용자 문서를 찾을 수 없습니다.");
                    alert("사용자 정보를 확인할 수 없습니다. 다시 로그인하세요.");
                    auth.signOut();
                    window.location.href = "/login.html";
                }
            } catch (error) {
                console.error("사용자 데이터를 가져오는 중 오류 발생:", error);
                alert("오류가 발생했습니다. 다시 로그인하세요.");
                auth.signOut();
                window.location.href = "/login.html";
            }
        } else {
            console.log("로그인되지 않은 사용자. 로그인 페이지로 리디렉션됩니다.");
            window.location.href = "/login.html";
        }
    });
} else {
    console.error("❌ Firebase Auth가 초기화되지 않았습니다.");
}

// 지도 관련 기존 코드 유지 (변경 없음)
const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

// 지도 생성 및 마커 표시 관련 기존 코드 유지
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


// 검색창 부분 코드 (수정된 부분)
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

    if (!userInput) {
        alert('검색어를 입력하세요.');
        return;
    }

    // 기존 모달 창 제거 (중복 방지)
    var existingModal = document.querySelector('.resultsModal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    var combinedResults = [];

    // 데이터값 검색
    var filtered = allInfo.filter(function(item) {
        return normalizeString(item.address).includes(userInput) ||
               normalizeString(item.number).includes(userInput);
    });

    if (filtered.length > 0) {
        filtered.forEach(function(item) {
            combinedResults.push({
                place_name: item.address,
                address_name: '데이터 기반',
                y: allPositions[allInfo.indexOf(item)].lat,
                x: allPositions[allInfo.indexOf(item)].lng
            });
        });
    }

    // Kakao Maps Places API 초기화
    var ps = new kakao.maps.services.Places();

    // 키워드 검색
    ps.keywordSearch(userInput, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            combinedResults = combinedResults.concat(data.map(function(place) {
                return {
                    place_name: place.place_name,
                    address_name: place.address_name,
                    y: place.y,
                    x: place.x
                };
            }));

            // 결과 표시
            if (combinedResults.length === 1) {
                moveToLocation(combinedResults[0]);
            } else {
                showResultsModal(combinedResults);
            }
        } else if (status === kakao.maps.services.Status.ZERO_RESULT && combinedResults.length > 0) {
            // API 결과는 없으나 데이터값 결과만 있는 경우
            showResultsModal(combinedResults);
        } else {
            alert('검색 결과가 없습니다.');
        }
    });
});

newSearchBtn.addEventListener('click', function() {
    newSearchForm.dispatchEvent(new Event('submit'));
});

function moveToLocation(place) {
    var position = new kakao.maps.LatLng(place.y, place.x);
    map.setCenter(position);
    map.setLevel(4);

    var tempMarker = new kakao.maps.Marker({
        position: position,
        map: map
    });

    setTimeout(function () {
        tempMarker.setMap(null);
    }, 10000);
}

function showResultsModal(results) {
    // 기존 모달 창 제거 (중복 방지)
    var existingModal = document.querySelector('.resultsModal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    var modal = document.createElement('div');
    modal.className = 'resultsModal';
    modal.style.position = 'absolute';
    modal.style.top = '20%';
    modal.style.left = '20%';
    modal.style.width = '60%';
    modal.style.background = '#fff';
    modal.style.padding = '20px';
    modal.style.zIndex = 1000;
    modal.style.overflowY = 'auto';
    modal.style.maxHeight = '400px';
    modal.style.border = '1px solid #ccc';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

    // 닫기 버튼 (X 표시) 추가
    var closeButton = document.createElement('span');
    closeButton.innerText = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '18px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.color = '#555';
    closeButton.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    modal.appendChild(closeButton);

    results.forEach(function(place) {
        var placeDiv = document.createElement('div');
        placeDiv.className = 'resultItem';
        placeDiv.style.cursor = 'pointer';
        placeDiv.style.padding = '10px';
        placeDiv.style.borderBottom = '1px solid #ddd';
        placeDiv.innerText = place.place_name + ' (' + place.address_name + ')';

        placeDiv.addEventListener('click', function() {
            document.body.removeChild(modal);
            moveToLocation(place);
        });

        modal.appendChild(placeDiv);
    });

    document.body.appendChild(modal);
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

// 좌표 클릭 이벤트 개선
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    if (isLatLngClickMode) {
        const latlng = mouseEvent.latLng;

        closeTempOverlay(); // 기존 오버레이 닫기

        const tempOverlayContent = `
            <div class="customOverlay">
                <span class="closeBtn" onclick="closeTempOverlay()">×</span>
                클릭한 위치의 위도는 ${latlng.getLat()} 이고, 경도는 ${latlng.getLng()} 입니다.
            </div>`;
        tempOverlay = new kakao.maps.CustomOverlay({
            content: tempOverlayContent,
            map: map,
            position: latlng,
            yAnchor: 2.0
        });

        // 임시 마커 추가
        const tempMarker = new kakao.maps.Marker({
            position: latlng,
            map: map
        });

        // 3초 후 임시 마커 제거
        setTimeout(() => {
            tempMarker.setMap(null);
        }, 3000);
    }
});

// Temp Overlay 닫기 함수 추가
function closeTempOverlay() {
    if (tempOverlay && typeof tempOverlay.setMap === "function") {
        tempOverlay.setMap(null);
        tempOverlay = null;
    }
}


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
        // 입력값 검증
        if (!lat || !lng || !number || !address) {
            throw new Error("필수 입력값이 누락되었습니다.");
        }

        console.log("마커 추가 시도:", { lat, lng, number, address, rotation, fixed, description, category });

        // Firestore에 데이터 추가
        const docRef = await db.collection("markers").add({
            latitude: lat,
            longitude: lng,
            number: number,
            address: address,
            rotation: rotation,
            fixed: fixed,
            description: description,
            category: category
        });

        console.log("마커 추가 성공:", docRef.id);
        alert(`마커가 성공적으로 추가되었습니다. 문서 ID: ${docRef.id}`);
    } catch (error) {
        console.error("마커 추가 중 오류 발생:", error);
        alert("마커 추가 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
}
// Firestore에서 실시간으로 마커 데이터를 수신하는 함수
function listenForMarkerUpdates() {
    const markersCollection = db.collection("markers"); // 수정된 부분

    // Firestore에서 데이터 수신
    markersCollection.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
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

                const overlayContent = document.createElement('div');
                overlayContent.className = 'customOverlay';
                overlayContent.innerHTML = `
                    <span class="closeBtn">×</span>
                    <div class="title">${data.category}</div>
                    <div class="desc">
                        <div class="desc-content">
                            <div>
                                <p><strong>관리번호:</strong> ${data.number}</p>
                                <p><strong>주소:</strong> ${data.address}</p>
                                <p><strong>회전형:</strong> ${data.rotation}</p>
                                <p><strong>고정형:</strong> ${data.fixed}</p>
                                <p><strong>상세설명:</strong> ${data.description}</p>
                            </div>
                        </div>
                    </div>
                `;

                const overlay = new kakao.maps.CustomOverlay({
                    position: markerPosition,
                    content: overlayContent,
                    yAnchor: 1.1
                });

                // 닫기 버튼 이벤트 추가
                overlayContent.querySelector('.closeBtn').addEventListener('click', function () {
                    if (currentOverlay && typeof currentOverlay.setMap === "function") {
                        currentOverlay.setMap(null);
                        currentOverlay = null;
                    }
                });

                // 마커 클릭 이벤트
                kakao.maps.event.addListener(marker, 'click', () => {
                    closeCustomOverlay(); // 기존 오버레이 닫기
                    overlay.setMap(map);
                    currentOverlay = overlay; // 새 오버레이 갱신
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
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
    document.getElementById('addMarkerButton').addEventListener('click', function () {
        document.getElementById('addMarkerForm').style.display = 'block';
    });

    // 닫기 버튼 클릭 시 폼 숨기기
    document.getElementById('closeMarkerFormButton').addEventListener('click', function () {
        document.getElementById('addMarkerForm').style.display = 'none';
    });

    // submitMarkerButton 클릭 시 Firestore에 데이터 저장
    document.getElementById('submitMarkerButton').addEventListener('click', async function () {
        const lat = parseFloat(document.getElementById('latitudeInput').value);
        const lng = parseFloat(document.getElementById('longitudeInput').value);
        const number = document.getElementById('numberInput').value;
        const address = document.getElementById('addressInput').value;
        const rotation = parseInt(document.getElementById('rotationInput').value);
        const fixed = parseInt(document.getElementById('fixedInput').value);
        const description = document.getElementById('descriptionInput').value;
        const category = document.getElementById('categoryInput').value;

        // Firestore에 마커 데이터 추가
        try {
            await addMarkerToFirestore(lat, lng, number, address, rotation, fixed, description, category);
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
