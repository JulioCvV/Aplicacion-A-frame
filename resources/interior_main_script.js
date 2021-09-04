let sonido=document.getElementById('factorySound');
let iconoSonido = document.getElementById('soundIcon');
let volumeBar = document.getElementById('volumeSlider');
let isPlaying = false;
let volumeVal = null;
let defaultValue = false;
let controlsInfo = null;

/**
 * Componente que permite llamar a la función que incia el sonido ambiente
 */
AFRAME.registerComponent('sonido_ambiente',{
    init: function () {
        let el = this.el
        el.addEventListener('loaded', e =>{
            playSound()
        } )
    }
});

/**
 * Componente que permite llamar a la función que muestra los controles al usuario
 */
AFRAME.registerComponent('controles-informacion',{
    init: function () {
        let el = this.el
        el.addEventListener('loaded', e =>{
            reveal()
        } )
    }
});

/**
 * Función que permite mostrar los controles al usuario
 */
function reveal() {
    controlsInfo = document.getElementById('controlsContainer')
    controlsInfo.style.display = "flex"
    hide()
}

/**
 * Función que remueve los controles de la interfaz despues de 10 segundos
 */
function hide(){
    setTimeout(() => {
        controlsInfo.style.display="none"
    }, 10000);
}

/**
 * Función que permite iniciar el sonido ambiente 
 */
function playSound() {
    if (isPlaying == false) {
        sonido.play()
        sonido.volume = 0.5
        iconoSonido.innerHTML = 'volume_up'
        isPlaying = true;

    }
}

/**
 * Función que permite desplegar los controles del audio
 */
function volumeControl() {
    volumeBar.style.display = 'block'
}

/**
 * Función que permite remover los controles del audio
 */
function quitVolumeControl() {
    volumeBar.style.display = 'none'
}

/**
 * Función que permite reducir o aumentar el volumen del sonido ambiente a traves del slide
 */
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

/**
 * Función que permite actualizar el volumen
 */
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
