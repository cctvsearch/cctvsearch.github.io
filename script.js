// Firebase 앱 재사용
const auth = window.auth;
const db = window.db;

// WebView에서 FlutterFlow로 UID 전달받기
window.setUserUID = function(uid) {
    console.log("Received UID:", uid);

    const userDocRef = db.collection("users").doc(uid);
    userDocRef.get()
        .then((doc) => {
            if (doc.exists) {
                console.log("User data:", doc.data());
            } else {
                console.error("No user document found!");
            }
        })
        .catch((error) => console.error("Error fetching user data:", error));
};

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


// Firebase 및 지도 관련 초기화
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc } from "firebase/firestore";

const firebaseConfig = {
    // Firebase 설정
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 지도 객체 초기화
let map;
document.addEventListener('DOMContentLoaded', function() {
    if (!map) {
        const mapOption = {
            center: new kakao.maps.LatLng(37.566535, 126.9779692),
            level: 5
        };
        map = new kakao.maps.Map(document.getElementById('map'), mapOption);
    }
    listenForMarkerUpdates();
});

// 사용자 인증 처리
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("로그인된 사용자 UID:", user.uid);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === "admin") {
                console.log("관리자 권한 확인됨.");
            } else {
                alert("관리자 권한이 필요합니다.");
                await auth.signOut();
                window.location.href = "/login.html";
            }
        } catch (error) {
            console.error("사용자 데이터 로드 중 오류:", error);
        }
    } else {
        console.log("로그인되지 않은 사용자.");
        window.location.href = "/login.html";
    }
});

// Firestore 마커 실시간 업데이트
function listenForMarkerUpdates() {
    const markersCollection = collection(db, "markers");
    onSnapshot(markersCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                const markerPosition = new kakao.maps.LatLng(data.latitude, data.longitude);

                const marker = new kakao.maps.Marker({
                    position: markerPosition,
                    map: map
                });

                const overlayContent = document.createElement('div');
                overlayContent.className = 'customOverlay';
                overlayContent.innerHTML = `
                    <span class="closeBtn">×</span>
                    <div class="title">${data.category}</div>
                    <div class="desc">
                        <p><strong>주소:</strong> ${data.address}</p>
                        <p><strong>설명:</strong> ${data.description}</p>
                    </div>
                `;

                const overlay = new kakao.maps.CustomOverlay({
                    position: markerPosition,
                    content: overlayContent,
                    yAnchor: 1.1
                });

                kakao.maps.event.addListener(marker, 'click', () => {
                    overlay.setMap(map);
                });
            }
        });
    });
}

// Firestore에 새 마커 추가
async function addMarkerToFirestore(lat, lng, number, address, rotation, fixed, description, category) {
    try {
        await addDoc(collection(db, "markers"), {
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

// 검색 기능 구현
function performSearch(userInput) {
    const combinedResults = [];
    const filtered = allInfo.filter(item => 
        normalizeString(item.address).includes(userInput) ||
        normalizeString(item.number).includes(userInput)
    );

    if (filtered.length > 0) {
        combinedResults.push(...filtered.map(item => ({
            place_name: item.address,
            address_name: "데이터 기반",
            y: allPositions[allInfo.indexOf(item)].lat,
            x: allPositions[allInfo.indexOf(item)].lng,
        })));
    }

    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(userInput, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            combinedResults.push(...data.map(place => ({
                place_name: place.place_name,
                address_name: place.address_name,
                y: place.y,
                x: place.x,
            })));
        }
        showResultsModal(combinedResults);
    });
}

function normalizeString(str) {
    return str.replace(/[-\s]/g, '').toLowerCase();
}

function showResultsModal(results) {
    // 기존 모달 삭제
    const existingModal = document.querySelector('.resultsModal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    const modal = document.createElement('div');
    modal.className = 'resultsModal';
    modal.style.cssText = `
        position: absolute;
        top: 20%;
        left: 20%;
        width: 60%;
        background: #fff;
        padding: 20px;
        z-index: 1000;
        overflow-y: auto;
        max-height: 400px;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    `;

    const closeButton = document.createElement('span');
    closeButton.innerText = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        color: #555;
    `;
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.appendChild(closeButton);

    results.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.className = 'resultItem';
        placeDiv.style.cssText = `
            cursor: pointer;
            padding: 10px;
            border-bottom: 1px solid #ddd;
        `;
        placeDiv.innerText = `${place.place_name} (${place.address_name})`;

        placeDiv.addEventListener('click', () => {
            document.body.removeChild(modal);
            moveToLocation(place);
        });

        modal.appendChild(placeDiv);
    });

    document.body.appendChild(modal);
}

function moveToLocation(place) {
    const position = new kakao.maps.LatLng(place.y, place.x);
    map.setCenter(position);
    map.setLevel(4);

    const tempMarker = new kakao.maps.Marker({
        position: position,
        map: map
    });

    setTimeout(() => {
        tempMarker.setMap(null);
    }, 10000);
}
