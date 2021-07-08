let sonido=document.getElementById('factorySound');
let iconoSonido = document.getElementById('soundIcon');
let volumeBar = document.getElementById('volumeSlider');
let isPlaying = false;
let volumeVal = null;
let defaultValue = false;
let controlsInfo = null;


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
