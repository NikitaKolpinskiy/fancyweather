const body                  = find('body');
const spinner               = find('#spinner');
const dropDownMenu          = find('#dropDownMenu');
const dropDownButton        = find('#dropDownButton');
const temperatureContainer  = find('#temperatureContainer');
const currentDate           = find('#currentDate');
const citySearch            = find('#citySearch');
const searchButton          = find('#searchButton');
const weatherForToday       = find('#weatherForToday');
const overcast              = find('#overcast');
const weatherToday          = find('#weatherToday');
const weatherWind           = find('#weatherWind');
const weatherHumidity       = find('#weatherHumidity');
const uiLatitude            = find('#uiLatitude');
const uiLongitude           = find('#uiLongitude');
const forecastDayTemplate   = find('#forecastDayTemplate');
const forecastDays          = find('#forecastDays');
const googleMap             = find('#googleMap');
const fahrenheit            = find('#fahrenheit');
const celsius               = find('#celsius');
const fahrenheitTempToday   = find('#fahrenheitTempToday');
const fahrenheitFeel        = find('#fahrenheitFeel');
const languageButtons       = findAll('.drop-down-language_button');
const countryUiValue        = findAll('.city-country_data');
const elementsToTranslate   = findAll('[data-i18n]');
const currentWeatherImage   = find('#currentWeatherImage');
const micBtn                = find("#voiceSearch");
const activeVoiceSearch     = find('#activeVoiceSearch');
const errorWrapper          = find('#errorWrapper');
const errorButton           = find('#errorButton');

const SpeechRecognition     = window.SpeechRecognition || window.webkitSpeechRecognition; 
const kelvinCoeff           = 273.15;
const translate = {
        'en' : {
            "search"    : "Search"   , 
            "feelsLike" : "FEELS LIKE", 
            "wind"      : "WIND"     , 
            "humidity"  : "HUMIDITY" , 
            "latitude"  : "Latitude" , 
            "longitude" : "Longitude", 
        },
        'ru' : {
            "search"    : "Поиск",
            "feelsLike" : "Ощущается как:",
            "wind"      : "Ветер",
            "humidity"  : "Влажность",
            "latitude"  : "Широта",
            "longitude" : "Долгота"
        },
        'be' : {
            "search"    : "Пошук",
            "feelsLike" : "Адчуваецца як:",
            "wind"      : "Вецер",
            "humidity"  : "Вільготнасць",
            "latitude"  : "Шырата",
            "longitude" : "Даўгата"
        }
};

const placeholderLang = {
    'en' : 'Search city',
    'ru' : 'Искать город',
    'be' : 'Шукаць горад'
}


const days = {
    'en' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'ru' : ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    'be' : ['Нядз', 'Пан', 'Аўт', 'Сер', 'Чац', 'Пят', 'Суб'],
};

const month = {
    'en' : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    'ru' : ['Янв', 'Фев', 'Мар', 'Апр', 'Мая', 'Июня', 'Июля', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    'be' : ['Студ', 'Лют', 'Сак', 'Крас', 'Мая', 'Чэрв', 'Лiп', 'Жнив', 'Вер', 'Кастр', 'Лист', 'Снеж'],
};

let activeLanguage = 'en';
let map;

navigator.geolocation.getCurrentPosition(searchWeather, error);

spinner.addEventListener('click', (e) => {
    spinner.firstElementChild.classList.add('spin');
    setTimeout(() => spinner.firstElementChild.classList.remove('spin'), 1400)
    getRandomImage(overcast.value)
})

dropDownButton.addEventListener('click', (e) => {
    dropDownMenu.classList.toggle('drop-down--open');
})

languageButtons.forEach((e) => e.addEventListener('click', switchLanguage))

temperatureContainer.addEventListener('click', (e) => {
    temperatureContainer.querySelectorAll('button').forEach((ev) => ev.classList.remove('active'))
    e.target.classList.add('active')
})

fahrenheit.addEventListener('click', switchTemperature);

celsius.addEventListener('click', switchTemperature);

searchButton.addEventListener('click', (e) => {
    searchWeather(citySearch.value);
});

errorButton.addEventListener('click', (e) => {
    errorWrapper.classList.add('hidden');
})

function getCurrentTime() {
    const date = new Date(); 
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const time = `${days[activeLanguage][date.getDay()]} ${date.getDate()} 
        ${month[activeLanguage][date.getMonth()]} ${hours}:${formatTime(minutes)}:${formatTime(seconds)}`;
    currentDate.innerText = time;
}

setInterval(getCurrentTime, 1000);

function searchWeather(geoData) {
    let latitude  = '';
    let longitude = '';
    let searchValue = '';

    if (typeof geoData === 'object') {
     latitude  = geoData.coords.latitude; 
     longitude = geoData.coords.longitude;
    } else if (typeof geoData === 'string') {
        searchValue = geoData;
    }

    citySearch.innerText = '';
    Promise.all(
            [sendWeatherRequest('GET',
                    `https://community-open-weather-map.p.rapidapi.com/weather?q=${searchValue}&lat=${latitude}&lon=${longitude}`),
                sendWeatherRequest('GET',
                    `https://community-open-weather-map.p.rapidapi.com/forecast/daily?q=${searchValue}&lat=${latitude}&lon=${longitude}&cnt=4&lang=ru`)
            ])
        .then(response => {
            console.log(response)
            const currWeatherData = response[0];
            const futureWeatherData = response[1];
            const cityName = currWeatherData.name;
            const countryName = currWeatherData.sys.country;
            const daysArray = futureWeatherData.list;
            const forecastDataArray = daysArray.slice(1, daysArray.length);
            const currLatitude = currWeatherData.coord.lat;
            const currLongitude = currWeatherData.coord.lon;
            const currHumidity = currWeatherData.main.humidity;
            const currWindSpeed = currWeatherData.wind.speed;
            const feelsLikeC = Math.round(currWeatherData.main.feels_like - kelvinCoeff);
            const feelsLikeF = Math.round((currWeatherData.main.feels_like - kelvinCoeff) * 9 / 5 + 32);
            const currOvercast = currWeatherData.weather[0].description;
            const currTemperatureC = Math.round(currWeatherData.main.temp - kelvinCoeff);
            const currTemperatureF = Math.round((currWeatherData.main.temp - kelvinCoeff) * 9 / 5 + 32);

            currentWeatherImage.src = `http://openweathermap.org/img/wn/${currWeatherData.weather[0].icon}@4x.png` ;
            uiLongitude.innerText = currLongitude;
            uiLatitude.innerText = currLatitude;
            weatherHumidity.innerText = currHumidity;
            weatherWind.innerText = currWindSpeed;
            weatherToday.innerText = `${feelsLikeC}°C`;
            weatherForToday.innerText = currTemperatureC;
            overcast.innerText = currOvercast.toUpperCase();
            fahrenheitTempToday.innerText = currTemperatureF;
            fahrenheitFeel.innerText = feelsLikeF;

            getRandomImage(currOvercast);

            if (citySearch.value) {
                cityName.innerText = `${cityName}, ${countryName}`.toUpperCase();
            }

            loadMap(currLatitude, currLongitude)

            forecastDays.innerHTML = '';

            forecastDataArray.forEach((e) => {
                let forecastDayTemplateClone    = forecastDayTemplate.cloneNode(true);
                let temperatureCDay             = forecastDayTemplateClone.querySelector('.temperature-c-day');
                let temperatureCNight           = forecastDayTemplateClone.querySelector('.temperature-c-night');
                let temperatureFDay             = forecastDayTemplateClone.querySelector('.temperature-f-day');
                let temperatureFNight           = forecastDayTemplateClone.querySelector('.temperature-f-night');
                let weekDays                    = forecastDayTemplateClone.querySelectorAll('[data-language]');
                let weatherImage                = forecastDayTemplateClone.querySelector('#weatherImage');
                let imgUrl = 'http://openweathermap.org/img/wn/10d@2x.png';

                weekDays.forEach((node) => node.innerText = days[node.dataset.language][(new Date(e.dt * 1000)).getDay()].toUpperCase())
                temperatureCDay.innerText = `${Math.round(e.temp.max - kelvinCoeff)}°`;
                temperatureCNight.innerText = `${Math.round(e.temp.min - kelvinCoeff)}°`;
                temperatureFDay.innerText = `${Math.round((e.temp.max - kelvinCoeff)*9/5 +32)}°`;
                temperatureFNight.innerText = `${Math.round((e.temp.min - kelvinCoeff)*9/5+32)}°`;
                forecastDays.appendChild(forecastDayTemplateClone);
                weatherImage.src = `http://openweathermap.org/img/wn/${e.weather[0].icon}@4x.png`;
                
            })
            return getCountryName(currLatitude, currLongitude);
        })
        .then(res => {
            res.forEach((e, i) => {
                const countryData = e.results[0].components;

                countryUiValue[i].innerText = `${countryData.city}, ${countryData.country}`.toUpperCase();
            });
        })
}

function sendWeatherRequest(method, url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let data = null;

        xhr.withCredentials = false;
        xhr.open(method, url);
        xhr.responseType = 'json';
        xhr.onload = () => {
            if (xhr.status >= 400) {
                reject(xhr.response)

            } else {
                resolve(xhr.response)
            }

            xhr.onerror = () => {
                reject(xhr.response)
            }
        }
        xhr.setRequestHeader("x-rapidapi-host", "community-open-weather-map.p.rapidapi.com");
        xhr.setRequestHeader("x-rapidapi-key", "13d02c0ec3mshcf8aa15a6cd5345p169bdbjsn04f0073db977");
        xhr.send(data)
    })
}

function getCountryName(latitude, longitude) {
    return Promise.all([
            fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=d178a7b12cdd4fddbc3ae49d7292b56f&language=en`),
            fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=d178a7b12cdd4fddbc3ae49d7292b56f&language=ru`),
            fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=d178a7b12cdd4fddbc3ae49d7292b56f&language=be`)
        ])
        .then(response => Promise.all(response.map((e) => e.json())))
}

function loadMap(latitude, longitude) {
    map = new google.maps.Map(googleMap, {
        center: {
            lat: latitude,
            lng: longitude
        },
        zoom: 11
    });
}

function getRandomImage(weatherOvercast) {
    fetch(`https://api.unsplash.com/photos/random?query=${weatherOvercast}t&client_id=Ovw5X8lByEXSqmlYLotNPFJ-RfkQGORSixYJwUAcPQ4&orientation=landscape`)
        .then(response => response.json())
        .then(result => {
            body.style.background = `url(${result.urls.full})`
        })
}

function findAll(selector) {
    return document.querySelectorAll(selector);
}

function find(selector) {
    return document.querySelector(selector);
}

function switchTemperature(e) {
    findAll(`.${ e.target.dataset.hideTemp }`).forEach(e => e.classList.add('hidden'));
    findAll(`.${ e.target.dataset.showTemp }`).forEach(e => e.classList.remove('hidden'));
}

function switchLanguage(e) {
    let forecastDaysUi = forecastDays.querySelectorAll('.week-day_data')
    activeLanguage = e.target.dataset.language;

    getCurrentTime(activeLanguage)

    citySearch.placeholder = placeholderLang[activeLanguage];

    forecastDaysUi.forEach((element) => e.target.dataset.language === element.dataset.language ? 
    element.classList.remove('hidden') : element.classList.add('hidden'));

    countryUiValue.forEach((node) => e.target.dataset.language === node.dataset.language ?
        node.classList.remove('hidden') : node.classList.add('hidden'));

    elementsToTranslate.forEach(element => {
        element.innerText = translate[activeLanguage][element.dataset.i18n]
    })
}

function formatTime(time) {
    return `${time}`.length > 1 ? time : `0${time}`;
}

function error() {
    errorWrapper.classList.remove('hidden');
}

if(SpeechRecognition) {
  console.log("Your Browser supports speech Recognition");
  
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";


  micBtn.addEventListener("click", micBtnClick);
  activeVoiceSearch.addEventListener('click', stopRecognition);

function micBtnClick(e) {   
    recognition.start();
    micBtn.classList.add('hidden')
}

  function stopRecognition () {
    recognition.stop();
  }

  recognition.addEventListener("start", startSpeechRecognition);
  function startSpeechRecognition() {
    micBtn.classList.add('hidden');
    activeVoiceSearch.classList.remove('hidden');
  }

  recognition.addEventListener("end", endSpeechRecognition); 
  function endSpeechRecognition() {
    activeVoiceSearch.classList.add('hidden');
    micBtn.classList.remove('hidden');
  }

  recognition.addEventListener("result", resultOfSpeechRecognition); 
  function resultOfSpeechRecognition(event) {
    const transcript = event.results[0][0].transcript;
    searchWeather(transcript);
  }
  
}
else {
  console.log("Your Browser does not support speech Recognition");
}