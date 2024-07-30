const allPositions = Apositions.concat(Bpositions, Cpositions, Dpositions, Epositions, Fpositions, Gpositions, Hpositions);
const allInfo = AInfo.concat(BInfo, CInfo, DInfo, EInfo, FInfo, GInfo, HInfo);

if (typeof kakao !== 'undefined' && kakao.maps) {
    var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
        mapOption = {
            center: new kakao.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
            level: 3 // 지도의 확대 레벨
        }; 

    var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

    var roadviewContainer = document.getElementById('roadview'); // 로드뷰를 표시할 div
    var roadview = new kakao.maps.Roadview(roadviewContainer); // 로드뷰 객체
    var roadviewClient = new kakao.maps.RoadviewClient(); // 좌표로부터 로드뷰 파노라마 ID를 가져올 로드뷰 helper 객체

    // 로드뷰 초기화
    var position = new kakao.maps.LatLng(33.450701, 126.570667);

    // 특정 위치의 좌표와 가까운 로드뷰의 panoId를 추출하여 로드뷰를 설정합니다.
    roadviewClient.getNearestPanoId(position, 50, function(panoId) {
        roadview.setPanoId(panoId, position); // 로드뷰 실행
    });

    // 마커 생성
    var markerPosition = new kakao.maps.LatLng(33.450701, 126.570667);
    var marker = new kakao.maps.Marker({
        position: markerPosition,
        map: roadview
    });
    
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
            var rvPosition = roadview.getPosition(); // 로드뷰의 현재 위치

            // 두 지점 사이의 거리 계산
            var distance = kakao.maps.geometry.spherical.computeDistanceBetween(rvPosition, markerPosition);

            // 거리 기준으로 마커 표시 여부 결정
            if (distance > 100) { // 예: 100m 이상 떨어지면 마커 숨김
                marker.setMap(null); // 마커 숨기기
            } else {
                marker.setMap(roadview); // 마커 표시
            }
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

        // 미니맵 마커 제거
        minimapMarkers.forEach(function(marker) {
            marker.setMap(null);
        });
        minimapMarkers = [];

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

                // 메인 지도에 마커 추가
                marker.setMap(map);

                // 미니맵에 마커 추가
                var minimapMarker = new kakao.maps.Marker({
                    position: markerPosition,
                    image: markerImage
                });
                minimapMarkers.push(minimapMarker);
                minimapMarker.setMap(minimap);

                kakao.maps.event.addListener(marker, 'click', function() {
                    showCustomOverlay(position, index);
                });

                kakao.maps.event.addListener(marker, 'touchstart', function() {
                    showCustomOverlay(position, index);
                });
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
            allInfo.forEach(function(info, index) {
                if (info.address === userInput) {
                    position = new kakao.maps.LatLng(allPositions[index].lat, allPositions[index].lng);
                    markerIndex = index;
                }
            });
        }

        if (position) {
            map.setCenter(position);

            if (markerIndex >= 0) {
                showCustomOverlay(allPositions[markerIndex], markerIndex);
            }
        } else {
            alert('입력한 주소나 좌표에 해당하는 위치를 찾을 수 없습니다.');
        }
    });

    var newSearchBtn = document.getElementById('newSearchBtn');
    newSearchBtn.addEventListener('click', function() {
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
            allInfo.forEach(function(info, index) {
                if (info.address === userInput) {
                    position = new kakao.maps.LatLng(allPositions[index].lat, allPositions[index].lng);
                    markerIndex = index;
                }
            });
        }

        if (position) {
            map.setCenter(position);

            if (markerIndex >= 0) {
                showCustomOverlay(allPositions[markerIndex], markerIndex);
            }
        } else {
            alert('입력한 주소나 좌표에 해당하는 위치를 찾을 수 없습니다.');
        }
    });

    function copyPositionToClipboard(lat, lng) {
        var textArea = document.createElement("textarea");
        textArea.value = lat + "," + lng;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("Copy");
        document.body.removeChild(textArea);
    }

    kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        if (isLatLngClickMode) {
            var latlng = mouseEvent.latLng;
            var message = '클릭한 위치의 좌표는 ' + latlng.toString() + ' 입니다.';
            copyPositionToClipboard(latlng.getLat(), latlng.getLng());

            if (tempOverlay) {
                tempOverlay.setMap(null);
                tempOverlay = null;
            }

            tempOverlay = new kakao.maps.CustomOverlay({
                position: latlng,
                content: '<div style="padding:5px; background-color:white; border:1px solid black;">' + message + '</div>',
                yAnchor: 1.1
            });

            tempOverlay.setMap(map);
        }
    });

    var toggleLatLngClickModeBtn = document.getElementById('toggleLatLngClickModeBtn');
    toggleLatLngClickModeBtn.addEventListener('click', function() {
        isLatLngClickMode = !isLatLngClickMode;

        if (isLatLngClickMode) {
            toggleLatLngClickModeBtn.textContent = '좌표 클릭 모드 해제';
        } else {
            toggleLatLngClickModeBtn.textContent = '좌표 클릭 모드 설정';

            if (tempOverlay) {
                tempOverlay.setMap(null);
                tempOverlay = null;
            }
        }
    });

    // 다이얼로그 초기화
    $(function() {
        $("#dialog").dialog({
            autoOpen: false,
            modal: true,
            buttons: {
                "복사": function() {
                    var lat = $("#latInput").val();
                    var lng = $("#lngInput").val();
                    copyPositionToClipboard(lat, lng);
                    $(this).dialog("close");
                },
                "닫기": function() {
                    $(this).dialog("close");
                }
            }
        });

        $("#openDialogBtn").button().on("click", function() {
            $("#dialog").dialog("open");
        });
    });
} else {
    console.error("Kakao Maps API is not defined. Please check if it's included and initialized properly.");
}
