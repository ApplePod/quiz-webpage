$(function(){

   //왼쪽 배경
	gsap.set('.sc-list .group-bg img',{transform:`scale(1.3)`})

	mainbgMotion = gsap.timeline({
	  paused:true,
	})

	mainbgMotion
	.to('.sc-list .group-bg img',6,{delay:0.3,transform:`scale(1)`})

	mainbgMotion.play();


      //예약하기 테마 슬라이드
    var listswiper = new Swiper(".listslide", {
      loop:true,
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 4,
		resistance : true,
        coverflowEffect: {
          rotate: 30,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        },
        breakpoints: {
          // when window width is >= 320px
          320: {
            slidesPerView: 1.5,
          },
          // when window width is >= 480px
          767: {
            slidesPerView: 3,
          },
          // when window width is >= 640px
          1024: {
            slidesPerView: 4,
          }
        },
		observer: true,	// 추가
		observeParents: true,	// 추가

      });

    // Custom Select 기능
    initCustomSelect();

})

// Custom Select 초기화 및 제어
function initCustomSelect() {
    // Custom Select 열기/닫기
    $(document).on('click', '.custom-select-trigger', function(e) {
        e.stopPropagation();
        var $wrapper = $(this).closest('.custom-select-wrapper');

        // 다른 열린 select 닫기
        $('.custom-select-wrapper').not($wrapper).removeClass('open');

        // 현재 select 토글
        $wrapper.toggleClass('open');
    });

    // 옵션 선택
    $(document).on('click', '.custom-select-option', function(e) {
        e.stopPropagation();
        var $option = $(this);
        var value = $option.attr('data-value');
        var text = $option.clone().find('.new-badge').remove().end().text().trim();
        var $wrapper = $option.closest('.custom-select-wrapper');
        var $trigger = $wrapper.find('.custom-select-trigger');
        var $hiddenSelect = $wrapper.find('select');

        // 선택된 옵션 표시
        $wrapper.find('.custom-select-option').removeClass('selected');
        $option.addClass('selected');

        // 트리거 텍스트 업데이트 (NEW 배지 포함)
        var newBadgeHtml = $option.find('.new-badge').length > 0 ? $option.find('.new-badge')[0].outerHTML : '';
        $trigger.html(text + newBadgeHtml);

        // 숨겨진 select 값 변경 및 change 이벤트 트리거
        $hiddenSelect.val(value).trigger('change');

        // select 닫기
        $wrapper.removeClass('open');
    });

    // 외부 클릭 시 닫기
    $(document).on('click', function() {
        $('.custom-select-wrapper').removeClass('open');
    });
}

// 지점 select를 custom select로 변환
function convertToCustomSelect(selectId) {
    var $select = $('#' + selectId);
    if ($select.length === 0) return;

    // 이미 custom select로 변환되었는지 확인
    if ($select.parent().hasClass('custom-select-wrapper')) return;

    var currentValue = $select.val();

    // Custom select HTML 생성
    var $wrapper = $('<div class="custom-select-wrapper"></div>');
    var $trigger = $('<div class="custom-select-trigger">지점선택</div>');
    var $options = $('<div class="custom-select-options"></div>');

    // 옵션 생성
    $select.find('option').each(function() {
        var $opt = $(this);
        var value = $opt.val();
        var text = $opt.text();
        var selected = value === currentValue ? 'selected' : '';

        // NEW 배지 포함 여부 확인 및 추출
        var newBadgeMatch = text.match(/<span class="new-badge">NEW<\/span>/);
        var cleanText = text.replace(/<span class="new-badge">NEW<\/span>/, '').trim();
        var newBadgeHtml = newBadgeMatch ? newBadgeMatch[0] : '';

        var $optionDiv = $('<div class="custom-select-option ' + selected + '" data-value="' + value + '">' +
                          '<span>' + cleanText + '</span>' + newBadgeHtml + '</div>');
        $options.append($optionDiv);

        // 선택된 옵션이면 트리거 텍스트 설정
        if (selected && value !== '') {
            $trigger.html('<span>' + cleanText + '</span>' + newBadgeHtml);
        }
    });

    // select 숨기고 custom select 추가
    $select.hide();
    $wrapper.append($trigger).append($options);
    $select.after($wrapper);
    $wrapper.append($select);
}