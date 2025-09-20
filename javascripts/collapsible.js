document.addEventListener('DOMContentLoaded', function() {
    // SVG 화살표 아이콘
    const arrowDownSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
    `;

    // 헤더를 찾고 접기 기능 추가
    function initializeCollapsibleHeaders() {
        const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
    headers.forEach((header, index) => {
            // 이미 처리된 헤더는 건너뛰기
            if (header.classList.contains('collapsible-header')) {
                return;
            }

            // 다음 헤더까지의 콘텐츠를 찾기
            const content = getContentBetweenHeaders(header);
            
            if (content.length === 0) {
                return; // 콘텐츠가 없으면 접기 기능 추가하지 않음
            }

            // 헤더에 접기 클래스 추가
            header.classList.add('collapsible-header');
            
            // 화살표 버튼 생성 (아직 DOM에 추가하지 않음)
            const toggleButton = document.createElement('span');
            toggleButton.className = 'header-toggle';
            toggleButton.innerHTML = arrowDownSvg;
            toggleButton.setAttribute('aria-label', '섹션 접기/펼치기');

            // 콘텐츠를 감쌀 컨테이너 생성
            const contentContainer = document.createElement('div');
            contentContainer.className = 'collapsible-content';
            
            // 콘텐츠를 컨테이너로 이동
            content.forEach(element => {
                contentContainer.appendChild(element);
            });
            
            // 헤더 다음에 컨테이너 삽입
            header.parentNode.insertBefore(contentContainer, header.nextSibling);

            // <!--fold=collapsed--> 주석 확인
            const headerText = header.innerHTML;
            const hasFoldComment = headerText.includes('<!--fold=collapsed-->');

            // 생성된 헤더에 고유 키를 부여하여 페이지별로 상태를 저장
            const persistKey = `mkdocs:collapsed:${location.pathname}:${index}`;
            const saved = localStorage.getItem(persistKey);

            // 주석 제거 (시각적 주석 제거는 항상 수행)
            if (hasFoldComment) {
                header.innerHTML = headerText.replace('<!--fold=collapsed-->', '');
            }

            // 우선순위: saved state (if exists) > fold comment default
            const startCollapsed = (saved === '1') || (saved === null && hasFoldComment);
            if (startCollapsed) {
                header.classList.add('collapsed');
                contentContainer.classList.add('collapsed');
            }

            // 토글 버튼은 한 번만 추가한다 (중복 방지)
            if (!header.querySelector('.header-toggle')) {
                // 헤더 텍스트 앞에 토글을 삽입 (왼쪽에 표시)
                const firstChild = header.firstChild;
                if (firstChild) {
                    header.insertBefore(toggleButton, firstChild);
                } else {
                    header.appendChild(toggleButton);
                }
            }

            // 클릭 이벤트 리스너
        const toggleSection = (e) => {
                // If the click was on the toggle control itself, perform toggle.
                if (e.target && e.target.closest && e.target.closest('.header-toggle')) {
                    // proceed to toggle below
                } else {
                    // If the click landed on any interactive element inside the header,
                    // allow its default behavior (navigation, form control, etc.) and
                    // do NOT treat it as a collapse toggle.
                    try {
                        const interactive = e.target && e.target.closest && e.target.closest(
                            'a, button, input, select, textarea, label, summary, details, [role="button"], [role="link"], [contenteditable], [tabindex]'
                        );
                        if (interactive) {
                            return; // let the interactive element handle the click
                        }
                    } catch (err) {
                        // defensive: fall through to toggle behavior if something fails
                    }
                }

                e.preventDefault();
                e.stopPropagation();

                const isCurrentlyCollapsed = header.classList.contains('collapsed');
                
                if (isCurrentlyCollapsed) {
                    // 펼치기
                    header.classList.remove('collapsed');
                    contentContainer.classList.remove('collapsed');
            // 저장: 0 = expanded
            try { localStorage.setItem(persistKey, '0'); } catch (err) {}
                } else {
                    // 접기
                    header.classList.add('collapsed');
                    contentContainer.classList.add('collapsed');
            // 저장: 1 = collapsed
            try { localStorage.setItem(persistKey, '1'); } catch (err) {}
                }
            };

            // 헤더와 화살표 버튼에 클릭 이벤트 추가
            header.addEventListener('click', toggleSection);
            toggleButton.addEventListener('click', toggleSection);
        });
    }

    // 헤더 간의 콘텐츠를 찾는 함수
    function getContentBetweenHeaders(startHeader) {
        const content = [];
        const startLevel = parseInt(startHeader.tagName.charAt(1));
        let currentElement = startHeader.nextElementSibling;

        while (currentElement) {
            // 다음 헤더를 만나면 중단
            // 변경: 하위 헤더(더 낮은 수준)이더라도 만나면 중단하여
            // 상위 헤더의 collapsible 콘텐츠에 하위 헤더가 포함되지 않도록 함
            if (currentElement.tagName && currentElement.tagName.match(/^H[1-6]$/)) {
                break;
            }

            // 푸터나 주석 관련 요소는 제외
            if (currentElement.classList.contains('md-footer') ||
                currentElement.classList.contains('md-source-file') ||
                currentElement.classList.contains('footnote') ||
                currentElement.className.includes('footnote')) {
                break;
            }

            content.push(currentElement);
            currentElement = currentElement.nextElementSibling;
        }

        return content;
    }

    // 초기화
    initializeCollapsibleHeaders();

    // MkDocs의 instant navigation을 위한 재초기화
    if (typeof document$ !== 'undefined') {
        document$.subscribe(() => {
            setTimeout(initializeCollapsibleHeaders, 100);
        });
    }

    // 페이지 변경 감지 (MkDocs Material)
    const observer = new MutationObserver((mutations) => {
        let shouldReinit = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && 
                mutation.target.classList.contains('md-content__inner')) {
                shouldReinit = true;
            }
        });
        
        if (shouldReinit) {
            setTimeout(initializeCollapsibleHeaders, 100);
        }
    });

    const contentContainer = document.querySelector('.md-content__inner');
    if (contentContainer) {
        observer.observe(contentContainer, {
            childList: true,
            subtree: true
        });
    }
});