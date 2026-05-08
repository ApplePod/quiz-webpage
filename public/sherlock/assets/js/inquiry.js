$(function(){
   //왼쪽 배경
    gsap.set('.sc-inquiry .group-bg img',{transform:`scale(1.3)`})

    mainbgMotion = gsap.timeline({
      paused:true,
    })

    mainbgMotion
    .to('.sc-inquiry .group-bg img',6,{delay:0.3,transform:`scale(1)`})

    mainbgMotion.play();
})