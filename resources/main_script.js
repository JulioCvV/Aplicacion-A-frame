let showDisplay = [1, 0, 0, 0];
let modal = document.getElementById("videoModal");
let video = document.getElementById("video");
let close = document.getElementById("closeButton");
let information = document.getElementById("container");
let isFirstTimePlaying = true
let sonido=document.getElementById('factorySound');
let iconoSonido = document.getElementById('soundIcon');
let volumeBar = document.getElementById('volumeSlider');
let isPlaying = false;
let volumeVal = null;
let defaultValue = false;
let controlsInfo = null;
let escena = document.querySelector('a-scene')
let next = document.getElementById('nextButton') 

function nextText() {
    let infoCards = ['info-01', 'info-02', 'info-03','info-04'];
    let elements = [];
    for (let i = 0; i < infoCards.length; i++) {
        elements.push(document.getElementById(infoCards[i]));
    }
    for (let i = 0; i < showDisplay.length; i++) {
        if (showDisplay[i] === 1) {
            elements[i].style.display = "none";
            showDisplay[i] = 0;
            if (i === showDisplay.length - 1) {
                elements[0].style.display = "flex";
                showDisplay[0] = 1;
            } else {
                elements[i + 1].style.display = "flex";
                showDisplay[i + 1] = 1;
            }
            break;
        }
    }
}


// let modal = null
// let video = null
// let information = null
// let firstTimePlaying = true

function openVideo() {
    // modal = document.getElementById("videoModal");
    // information = document.getElementById("container");
    modal.style.display = "block";
    // information.style.display = "none"
    if(isFirstTimePlaying==false){
        video.removeAttribute('autoplay', '')
        video.setAttribute('controls','')
    }else{
        video.setAttribute('autoplay','')
    }
}

function endText() {
    information.style.display = "none"
    nextText()
}

video.onended = function (e) {
    close.style.display = "flex"
}

function closeVideo() {
    // video = document.getElementById("video");
    modal.style.display = "none";
    video.pause();
    video.currentTime = 0;
    let fisrtClick = false;
    next.removeAttribute('disabled');
    if(isFirstTimePlaying && fisrtClick==false){
        createPortal()
        fisrtClick = true
        isFirstTimePlaying = false
    }
}

window.onclick = function (e) {
    if (e.target == modal && isFirstTimePlaying == false) {
        modal.style.display = "none";
        video.pause();
        video.currentTime = 0;
    }
}

function createPortal(){
    let portal = document.createElement('a-entity');
    portal.setAttribute('link',{
        href: 'inside.html',
    });
    portal.setAttribute('geometry',{
        primitive: 'plane',
        height: 6.5,
        width: 8.5
    });
    portal.setAttribute('material',{
        backgroundColor: '#1a1a1a',
        blending: 'normal',
        borderEnabled: 0,
        pano: '#entrada',
        shader: 'portal',
        side: 'double'
    });
    portal.setAttribute('position',{x:-13.5,y: 3.3, z: -6.5});
    portal.setAttribute('animation',{
        property: 'scale',
        from: '1 0 1',
        to: '1 1 1',
        easing: 'linear',
        dur: 1500,
        loop: 1,
        autoplay: 'true',
        
    })
    escena.appendChild(portal)
}


AFRAME.registerComponent('sonido_ambiente',{
    init: function () {
        let el = this.el
        el.addEventListener('loaded', e =>{
            playSound()
        } )
    }
});

AFRAME.registerComponent('controles-informacion',{
    init: function () {
        let el = this.el
        el.addEventListener('loaded', e =>{
            reveal()
        } )
    }
});

function reveal() {
    controlsInfo = document.getElementById('controlsContainer')
    controlsInfo.style.display = "flex"
    hide()
}

function hide(){
    setTimeout(() => {
        controlsInfo.style.display="none"
    }, 10000);
}

function playSound() {

    if (isPlaying == false) {
        sonido.play()
        sonido.volume = 0.5
        iconoSonido.innerHTML = 'volume_up'
        isPlaying = true;

    }
}

function volumeControl() {
    volumeBar.style.display = 'block'
}

function quitVolumeControl() {
    volumeBar.style.display = 'none'
}

volumeBar.oninput = function () {
    volumeVal = volumeBar.value
    sonido.volume = volumeVal / 100
    if (sonido.volume === 0) {
        iconoSonido.innerHTML = 'volume_off'
        isPlaying = false;
        defaultValue = true;
    } else if (sonido.volume <= 0.5 && sonido.volume >= 0) {
        iconoSonido.innerHTML = 'volume_down'
    } else {
        iconoSonido.innerHTML = 'volume_up'
    }
}


function updateSound() {
    if (isPlaying == false && sonido.volume == 0 && defaultValue == false) {
        sonido.volume = volumeVal / 100
        volumeBar.value = volumeVal
        if (sonido.volume <= 0.5 && sonido.volume >= 0) {
            iconoSonido.innerHTML = 'volume_down'
        } else {
            iconoSonido.innerHTML = 'volume_up'
        }
        isPlaying = true;
    } else if (isPlaying == true && sonido.volume != 0 && defaultValue == false) {
        sonido.volume = 0
        volumeVal = volumeBar.value
        volumeBar.value = 0
        iconoSonido.innerHTML = 'volume_off'
        isPlaying = false
    } else if (isPlaying == false && sonido.volume == 0 && defaultValue == true) {
        sonido.volume = 0.5
        volumeBar.value = sonido.volume * 100
        iconoSonido.innerHTML = 'volume_up'
        isPlaying = true
        defaultValue = false
    }
}


