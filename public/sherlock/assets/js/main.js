$(function(){

	var myFullpage = new fullpage('#fullpage', {
		scrollingSpeed:1000,

		//모바일 화면에서는 스크롤이 되도록
		responsiveWidth: 774,

		afterLoad: function(origin, destination, direction) {
		  // Check if the destination is a section with a video
		  if (destination.item.classList.contains('section')) {
			// Get the video element inside the destination section
			var video = destination.item.querySelector('video');

			// Play the video from the beginning
			if (video) {
			  video.currentTime = 0;
			  video.play();
			}
		  }
		},
		onLeave: function(origin, destination, direction) {
		  // Check if the origin is a section with a video
		  if (origin.item.classList.contains('section')) {
			// Get the video element inside the origin section
			var video = origin.item.querySelector('video');

			// Set the current time of the video to 0 when leaving the section
			if (video) {
			  video.currentTime = 0;
			}
		  }
		}

	});


	$('.menu-wrap').click(function(){
      $('.group-nav').toggleClass('on');
      $('.menu-wrap').toggleClass('on');
    })



	//좌측 하단 네부 클릭 시 해당 섹션으로 이동
	$('.fix-navi .dot-item').click(function(){
		idx=$(this).index()+1;
		index=$(this).index();
		fullpage_api.moveTo(idx);		
	})


    //메인 타이틀
    const headTxt = new SplitType('.sc-visual .title span', { types: 'words, chars', });

    gsap.set('.sc-visual .title span .char',{opacity:0})
    gsap.set('.sc-visual .sub-text',{opacity:0,y:15})
    gsap.set('.sc-visual .btn-reservation',{opacity:0,y:15})

    mainMotion = gsap.timeline({
      paused:true,
    })

    mainMotion
    .to('.sc-visual .title span .char',{ dalay:0.3,opacity:1,stagger:{from:"random",amount:2,}})
    .addLabel('a')
    .to('.sc-visual .sub-text',{opacity:1,y:0},'a')
    .to('.sc-visual .btn-reservation',{opacity:1,y:0},'a')

    mainMotion.play();


    //메인 배경
    gsap.set('.sc-visual .group-bg img',{transform:`scale(1.3)`})

    mainbgMotion = gsap.timeline({
      paused:true,
    })

    mainbgMotion
    .to('.group-bg img',6,{delay:0.3,transform:`scale(1)`})

    mainbgMotion.play();





    //메인 테마 슬라이드
    var themeslide = new Swiper(".themeslide_p", {
		loop:true,
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 4,
		resistance : false, // 슬라이드 터치 저항 여부
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
            slidesPerView: 2,
          }
        },
		observer: true,	// 추가
		observeParents: true,	// 추가

      });


      //메인 테마 슬라이드
    var themeslide = new Swiper(".themeslide_t", {
      loop:true,
          effect: "coverflow",
          grabCursor: true,
          centeredSlides: true,
          slidesPerView: 4,
      resistance : false, // 슬라이드 터치 저항 여부
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


        //메인 테마 슬라이드
    var themeslide = new Swiper(".themeslide", {
      loop:true,
          effect: "coverflow",
          grabCursor: true,
          centeredSlides: true,
          slidesPerView: 4,
      resistance : false, // 슬라이드 터치 저항 여부
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
              slidesPerView: 6,
            }
          },
      observer: true,	// 추가
      observeParents: true,	// 추가
  
        });

  
})