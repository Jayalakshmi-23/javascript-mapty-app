'use strict';

// APPLICATION ARCHITECTURE
const form = document.querySelector('.form'),
containerWorkouts = document.querySelector('.workouts'),
inputType = document.querySelector('.form__input--type'),
inputDistance = document.querySelector('.form__input--distance'),
inputDuration = document.querySelector('.form__input--duration'),
inputCadence = document.querySelector('.form__input--cadence'),
inputElevation = document.querySelector('.form__input--elevation');

// let map, mapEvent;
class WorkOut {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        // this. date =
        // this.id = 
        this.coords = coords;
        this.distance = distance; // in km
        this.duration = duration; // in min

    }
    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
    click() {
        this.clicks++;
    }
}

class Running extends WorkOut {
    type = 'running';

    constructor(coords, distance, duration,cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
        
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends WorkOut {
    type = 'cycling';
    
    constructor(coords, distance, duration,elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
        
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycle1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycle1);

//  APPLICATION ARCHITECTURE
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];

    constructor() {
        this._getPostion();
        // Get data from local storage
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkOut.bind(this));
        
        inputType.addEventListener('change', this._toggleElevationField);

        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))

    }
    
    _getPostion() {
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
                alert('Could not get your current position');
            });
        }
    }
    _loadMap(position) {
        const {latitude, longitude}  = position.coords;

        const coods = [latitude, longitude]
        
        this.#map = L.map('map').setView(coods, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showFrom.bind(this));

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        })
    }
    _showFrom(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideForm(){

        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =''; 
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(function(){
            form.style.display = 'grid';
        }, 1000)
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkOut(e) {

        const validInputs = (...inputs) => {
            return inputs.every(input => Number.isFinite(input));
        }
        const allPositives = (...inputs) => {
            return inputs.every(inp => inp > 0);
        }
        e.preventDefault();
        const {lat, lng} = this.#mapEvent.latlng;

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        let workout;

        // if workout is running,
        if(type === 'running'){
            //check is the data is valid
            const cadence = +inputCadence.value;
    
            if(!validInputs(distance, duration, cadence) || !allPositives(distance, duration, cadence)){
                return alert('input have to be positive numbers');
            }

            workout = new Running([lat,lng], distance, duration, cadence);
        }

        // if workout is cycling,
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            if(!validInputs(distance, duration, elevation) || !allPositives(distance, duration)){
                return alert('input have to be positive numbers');
            }

            workout = new Cycling([lat,lng], distance, duration, elevation);
        }

        this.#workouts.push(workout);
    
        this._renderWorkoutMarker(workout);
       this._renderWorkout(workout);

        this._hideForm();   

        // local storage
        this._setLocalStorage();
    }



    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth:250,
            minWidth:100,
            autoClose:false,
            closeOnClick:false,
            className:`${workout.type}-popup`,

        })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' } ${workout.description}`)
        .openPopup();
    }

    _renderWorkout(workout) {
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
                            <h2 class="workout__title">${workout.description}</h2>
                            <div class="workout__details">
                            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }</span>
                            <span class="workout__value">${workout.distance}</span>
                            <span class="workout__unit">km</span>
                            </div>
                            <div class="workout__details">
                            <span class="workout__icon">⏱</span>
                            <span class="workout__value">${workout.duration}</span>
                            <span class="workout__unit">min</span>
                        </div>
                        `;

      if(workout.type === 'running'){
        html += ` <div class="workout__details">
                        <span class="workout__icon">⚡️</span>
                        <span class="workout__value">${workout.pace.toFixed(1)}</span>
                        <span class="workout__unit">min/km</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">🦶🏼</span>
                        <span class="workout__value">${workout.cadence}</span>
                        <span class="workout__unit">spm</span>
                    </div>
                    </li>`;
      }

      if(workout.type === 'cycling'){
          html += `<div class="workout__details">
                        <span class="workout__icon">⚡️</span>
                        <span class="workout__value">${workout.speed.toFixed(1)}</span>
                        <span class="workout__unit">km/h</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">⛰</span>
                        <span class="workout__value">${workout.elevationGain}</span>
                        <span class="workout__unit">m</span>
                    </div>
                    </li>`;          
      }
      form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        
        if(!workoutEl) return;
        
        const workoutData = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        this.#map.setView(workoutData.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration:1,
            }
        });
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if(!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}


const app = new App();

