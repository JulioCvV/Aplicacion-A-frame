/** variables relacionadas con el sonido ambiente */
let sound = document.getElementById("factorySound");
let soundIcon = document.getElementById("soundIcon");
let volumeBar = document.getElementById("volumeSlider");
let isPlaying = false;
let turnSoundOff = false;
let volumeVal = null;
let defaultValue = false;
/** variables relacionadas con la información de la escena */
let showDisplay = [1, 0, 0, 0];
let information = document.getElementById("container");
let controlsInfo = null;
let escena = document.querySelector("a-scene");
let next = document.getElementById("nextButton");
let infoPractice = "";
let description = document.getElementById("practice-description");
let names = document.getElementById("studentName");
let namesInside = document.getElementById("studentNameInside");
let bubble = document.getElementById("taskSign");
/** variables relacionadas con el video */
let modal = document.getElementById("videoModal");
let video = document.getElementById("video");
let videoContainer = document.getElementById("videoContainer");
let close = document.getElementById("closeButton");

let isFirstTimePlaying = true;
/** variables relacionadas con el sonido del video */
let videoSoundContainer = document.getElementById("videoVolumeControl");
let videoSoundIcon = document.getElementById("videoSoundIcon");
let videoVolumeBar = document.getElementById("videoVolumeSlider");
let isVideoSoundPlaying = false;
let videoVolumeVal = null;
let videoSoundDefaultValue = false;
let url = "";

const REFRESCOS = "Refrescos";
const BOLSA_ARROZ = "Bolsa de arroz";
const BARRA_CHOCOLATE = "Barra de chocolate";
const BARRA_JABON = "Barra de jabon";
const PITILLOS = "Pitillos";

const videoConstants = {
  [BARRA_CHOCOLATE]: "resources/Videos/Barra_chocolate.mp4",
  [BARRA_JABON]: "resources/Videos/Barra_jabon.mp4",
  [BOLSA_ARROZ]: "resources/Videos/Bolsa_arroz.mp4",
  [PITILLOS]: "resources/Videos/Pitillos.mp4",
  [REFRESCOS]: "resources/Videos/Refrescos.mp4",
};

window.onload = function () {
  window.parent.postMessage("openedReady", "http://localhost:3000");
};

// infoPractice = {
//     "nombre": "Siete herramientas estadísticas",
//     "descripcion": "Inspecciona cada uno de los productos y aplica las herramientas solicitadas",
//     "producto": "Refresco",
//     "estudiante": "Julio Vallejo Vera"
// };

/**
 * Función que permite obtener, desde la aplicación de React, la información correspondiente al nombre del usuario y la práctica asignada,
 * incluyedno esta ultmia (nombre de la práctica, su descirpción y el producto asignado al usuario/estudiante). Además, almacena el nombre
 * del usuario en el sessionStorage para ser posteriormente usado en la otra escena.
 */
window.addEventListener("message", (e) => {
  if (e.origin !== "http://localhost:3000") return;
  console.log("DATOS", e.data);
  infoPractice = JSON.parse(e.data);
  console.log(infoPractice.url);
  names.innerHTML = infoPractice.estudiante;
  sessionStorage.setItem("userName", infoPractice.estudiante);
  url = infoPractice.url;
  sessionStorage.setItem("url", url);
});

/**
 * Función que permite devolver una respuesta a la aplicación de React una vez el usuario ha terminado
 * el recorrido por el entorno virtual.
 */
function responseToParent() {
  window.parent.postMessage("ya, saqueme de aqui!", "http://127.0.0.1:5500");
}

/**
 * Función que permite visualizar los dialogos y avanzar entre estos
 */
function nextText() {
  description.innerHTML = infoPractice.descripcion;
  let infoCards = ["info-01", "info-02", "info-03", "info-04"];
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

/**
 * Función para desplegar el video referente al producto asignado al usuario, en caso de no ser la primera
 * visualización se agregan los controles para que el usuario pueda avanzar o retroceder el video a su disposición.
 */
function openVideo(e) {
  let product = videoConstants[infoPractice.producto];
  video.src = product;

  infoPractice.producto === REFRESCOS
    ? (videoContainer.style.width = "40rem")
    : "";

  modal.style.display = "block";
  if (isFirstTimePlaying == false) {
    video.removeAttribute("autoplay", "");
    video.setAttribute("controls", "");
    video.setAttribute("controlslist", "nodownload");
    videoSoundContainer.style.display = "none";
    video.volume = 0.5;
  } else {
    video.setAttribute("autoplay", "");
    video.volume = 0.5;
    video.playbackRate = 10;
    isVideoSoundPlaying = true;
  }
  if (turnSoundOff == false) {
    updateSound(e);
  }
}

/**
 * Función que permite finalizar con los dialogos
 */
function endText() {
  information.style.display = "none";
  nextText();
}

/**
 * Función para cerrar los dialogos
 */
function closeInfoCards() {
  information.style.display = "none";
}

/**
 * Se asegura de la existencia del video para posteriormente desplegar el botón de cerrar
 */
if (video) {
  video.onended = function (e) {
    close.style.display = "flex";
  };
}

/**
 * Función que permite cerrar el video referente al producto asignado al usuario, en caso de ser la
 * primera visualización, también llama a la función encargada de crear el portal.
 */
function closeVideo(e) {
  modal.style.display = "none";
  video.pause();
  video.currentTime = 0;
  let fisrtClick = false;
  next.removeAttribute("disabled");
  if (isFirstTimePlaying && fisrtClick == false) {
    createPortal();
    fisrtClick = true;
    isFirstTimePlaying = false;
  }
  console.log("al cerrar: " + turnSoundOff);
  if (turnSoundOff == false) {
    updateSound(e);
  }
}

/**
 * Función quepermite cerrar el video mediante el modal
 */
window.onclick = function (e) {
  if (e.target == modal && isFirstTimePlaying == false) {
    modal.style.display = "none";
    video.pause();
    video.currentTime = 0;
  }
};

/**
 * Función que permite añadir el portal en la escena #1 para que el usuario pueda ingresar a la escena #2
 */
function createPortal() {
  let portal = document.createElement("a-entity");
  portal.setAttribute("link", {
    href: "inside.html",
  });
  portal.setAttribute("geometry", {
    primitive: "plane",
    height: 6.5,
    width: 8.5,
  });
  portal.setAttribute("material", {
    backgroundColor: "#1a1a1a",
    blending: "normal",
    borderEnabled: 0,
    pano: "#entrada",
    shader: "portal",
    side: "double",
  });
  portal.setAttribute("position", { x: -13.5, y: 3.3, z: -6.5 });
  portal.setAttribute("animation", {
    property: "scale",
    from: "1 0 1",
    to: "1 1 1",
    easing: "linear",
    dur: 1500,
    loop: 1,
    autoplay: "true",
  });
  portal.setAttribute("class", "raycasteable");
  escena.appendChild(portal);
}

/**
 * Funcion que permite añadir el sonido a los camiones
 */
function addTrucksSound() {
  let camion_01 = document.getElementById("camion_01");
  let camion_02 = document.getElementById("camion_02");

  camion_01.setAttribute("sound", {
    src: "#andando",
    loop: "true",
    autoplay: "true",
    refDistance: "5",
    volume: "1",
  });

  camion_02.setAttribute("sound", {
    src: "#andando",
    loop: "true",
    autoplay: "true",
    refDistance: "5",
    volume: "1",
  });
}

/**
 * Función que permite mostrar los controles al usuario
 */
function reveal() {
  controlsInfo = document.getElementById("controlsContainer");
  controlsInfo.style.display = "flex";
  hide();
}

/**
 * Función que remueve los controles de la interfaz despues de 10 segundos
 */
function hide() {
  setTimeout(() => {
    controlsInfo.style.display = "none";
  }, 10000);
}

/**
 * Función que permite iniciar el sonido ambiente
 */
function playSound() {
  if (isPlaying == false) {
    sound.play();
    sound.volume = 0.5;
    soundIcon.innerHTML = "volume_up";
    isPlaying = true;
  }
}

/**
 * Función que permite desplegar los controles del audio
 */
function volumeControl() {
  volumeBar.style.display = "block";
}

/**
 * Función que permite remover los controles del audio
 */
function quitVolumeControl() {
  volumeBar.style.display = "none";
}

/**
 * Función que permite reducir o aumentar el volumen del sonido ambiente a traves del slide
 */
volumeBar.oninput = function () {
  volumeVal = volumeBar.value;
  sound.volume = volumeVal / 100;
  if (sound.volume === 0) {
    soundIcon.innerHTML = "volume_off";
    isPlaying = false;
    defaultValue = true;
  } else if (sound.volume <= 0.5 && sound.volume >= 0) {
    soundIcon.innerHTML = "volume_down";
  } else {
    soundIcon.innerHTML = "volume_up";
  }
};

/**
 * Función que permite actualizar el volumen
 */
function updateSound(e) {
  console.log(e.id);
  if (e.id == "soundButton" && turnSoundOff == false) {
    turnSoundOff = true;
  } else {
    turnSoundOff = false;
  }

  if (
    isPlaying == false &&
    sound.volume == 0 &&
    defaultValue == false &&
    turnSoundOff == false
  ) {
    sound.volume = volumeVal / 100;
    volumeBar.value = volumeVal;
    if (sound.volume <= 0.5 && sound.volume >= 0) {
      soundIcon.innerHTML = "volume_down";
    } else {
      soundIcon.innerHTML = "volume_up";
    }
    isPlaying = true;
  } else if (
    isPlaying == true &&
    sound.volume != 0 &&
    defaultValue == false &&
    turnSoundOff == true
  ) {
    sound.volume = 0;
    volumeVal = volumeBar.value;
    volumeBar.value = 0;
    soundIcon.innerHTML = "volume_off";
    isPlaying = false;
  } else if (
    isPlaying == true &&
    sound.volume != 0 &&
    defaultValue == false &&
    turnSoundOff == false
  ) {
    sound.volume = 0;
    volumeVal = volumeBar.value;
    volumeBar.value = 0;
    soundIcon.innerHTML = "volume_off";
    isPlaying = false;
  } else if (
    isPlaying == false &&
    sound.volume == 0 &&
    defaultValue == true &&
    turnSoundOff == false
  ) {
    sound.volume = 0.5;
    volumeBar.value = sound.volume * 100;
    soundIcon.innerHTML = "volume_up";
    isPlaying = true;
    defaultValue = false;
  }
}

/**
 * Función que permite desplegar los controles del audio
 */
function videoVolumeControl() {
  videoVolumeBar.style.display = "block";
}

/**
 * Función que permite remover los controles del audio
 */
function quitVideoVolumeControl() {
  videoVolumeBar.style.display = "none";
}

/**
 * Función que permite reducir o aumentar el volumen del video a traves del slide
 */
if (video) {
  videoVolumeBar.oninput = function () {
    videoVolumeVal = videoVolumeBar.value;
    video.volume = videoVolumeVal / 100;
    if (video.volume === 0) {
      videoSoundIcon.innerHTML = "volume_off";
      isVideoSoundPlaying = false;
      videoSoundDefaultValue = true;
    } else if (video.volume <= 0.5 && video.volume >= 0) {
      videoSoundIcon.innerHTML = "volume_down";
    } else {
      videoSoundIcon.innerHTML = "volume_up";
    }
  };
}

/**
 * Función que permite actualizar el volumen delvideo
 */
function updateVideoSound() {
  if (
    isVideoSoundPlaying == false &&
    video.volume == 0 &&
    videoSoundDefaultValue == false
  ) {
    video.volume = videoVolumeVal / 100;
    videoVolumeBar.value = videoVolumeVal;
    if (video.volume <= 0.5 && video.volume >= 0) {
      videoSoundIcon.innerHTML = "volume_down";
    } else {
      videoSoundIcon.innerHTML = "volume_up";
    }
    isVideoSoundPlaying = true;
  } else if (
    isVideoSoundPlaying == true &&
    video.volume != 0 &&
    videoSoundDefaultValue == false
  ) {
    video.volume = 0;
    videoVolumeVal = videoVolumeBar.value;
    videoVolumeBar.value = 0;
    videoSoundIcon.innerHTML = "volume_off";
    isVideoSoundPlaying = false;
  } else if (
    isVideoSoundPlaying == false &&
    video.volume == 0 &&
    videoSoundDefaultValue == true
  ) {
    video.volume = 0.5;
    videoVolumeBar.value = video.volume * 100;
    videoSoundIcon.innerHTML = "volume_up";
    isVideoSoundPlaying = true;
    videoSoundDefaultValue = false;
  }
}

/**
 * Función que permite conocer cuando la escena ha terminado de cargar y poder remover el loader
 */
document.addEventListener("DOMContentLoaded", function () {
  let scene = document.querySelector("a-scene");
  let landing = document.getElementById("landing");
  let title = document.getElementById("title");
  let loader = document.getElementById("loader");
  let enterButton = document.getElementById("enterButton");

  let path = window.location.pathname;
  let page = path.split("/").pop();

  scene.addEventListener("loaded", function (e) {
    setTimeout(() => {
      loader.style.display = "none";
      enterButton.style.position = "unset";
      enterButton.removeAttribute("disabled");
      title.innerHTML = "Tu experiencia se ha cargado";
    }, 2000);
  });

  enterButton.addEventListener("click", function (e) {
    landing.style.display = "none";
    playSound();
    addTrucksSound();
    reveal();
  });
});
