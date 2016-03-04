/*
 * Track the progress of a learner during a session.
 * Used by the SCORM API.
 */
CODEditor.ProgressTracking = (function(C,$,undefined){

	//Constants
	var SCORE_THRESHOLD = 0.5;

	//Auxiliar vars
	var initialized = false;
	var objectives = {};
	var hasScore = false;
	var startTime;


	var init = function(animation,callback){
		if(initialized===false){
			initialized = true;

			_createObjectives();
			startTime = new Date();
		}
	};


	/* Events */

	var lastTimer;

	var onLoadExercise = function(exerciseJSON){
		if(!initialized){
			return;
		}

		if(typeof lastTimer !== "undefined"){
			clearTimeout(lastTimer);
			lastTimer = undefined;
		}

		var tltNumber = _getTLT(exerciseJSON);
		var tltObjective = objectives["TLT_for_exercise_" + (exerciseJSON.id).toString()];
		if((typeof tltNumber==="number")&&(typeof tltObjective == "object")){
			var period = 2;
			if(tltObjective.timeSpent < tltNumber){
				tltObjective.timer = setInterval(function(){
					tltObjective.timeSpent += period;
					tltObjective.progress = Math.min(1,tltObjective.timeSpent/tltNumber);
					if(tltObjective.progress == 1){
						tltObjective.completed = true;
						clearTimeout(tltObjective.timer);
						lastTimer = undefined;
						C.SCORM.onProgressObjectiveUpdated(tltObjective);
					}
				},period*1000);
				lastTimer = tltObjective.timer;
			}
		}
	};

	var onDoCurrentExercise = function(score){
		if(!initialized){
			return;
		}

		var currentExercise = C.CORE.getCurrentExercise();
		if((typeof currentExercise == "object")&&(typeof currentExercise.id == "number")){
			if(typeof objectives[currentExercise.id] == "object"){

				var mustUpdateObjective = false;

				var objectiveProgress = 1;
				if((typeof objectives[currentExercise.id].progress != "number")||(objectives[currentExercise.id].progress < objectiveProgress)){
					objectives[currentExercise.id].progress = objectiveProgress;
					if(objectives[currentExercise.id].progress === 1){
						objectives[currentExercise.id].completed = true;
					}
					mustUpdateObjective = true;
				}

				if((typeof score == "number")&&(!isNaN(score))){
					//objectives[currentExercise.id].score should be a score in a 0-1 scale.
					//score is a number in a 0-10 scale.
					var scaledScore = score/10;

					if ((typeof objectives[currentExercise.id].score != "number")||(objectives[currentExercise.id].score < scaledScore)){
						objectives[currentExercise.id].score = scaledScore;
						if(scaledScore >= SCORE_THRESHOLD){
							objectives[currentExercise.id].success = true;
						} else {
							objectives[currentExercise.id].success = false;
						}
						mustUpdateObjective = true;
					}
				}
			}

			if(mustUpdateObjective){
				C.SCORM.onProgressObjectiveUpdated(objectives[currentExercise.id]);
			}
		}
	};


	/* Module Methods */

	//Return a value in a [0,1] scale
	var getProgressMeasure = function(){
		var overallProgressMeasure = 0;
		Object.keys(objectives).forEach(function(key){
			if((typeof objectives[key].progress == "number")&&(typeof objectives[key].completionWeight == "number")){
				overallProgressMeasure += objectives[key].progress * objectives[key].completionWeight;
			}
		});
		return +(overallProgressMeasure).toFixed(6);
	};

	//Return a value in a [0,1] scale
	var getScore = function(){
		var overallScore = 0;
		Object.keys(objectives).forEach(function(key){
			if((typeof objectives[key].score == "number")&&(typeof objectives[key].scoreWeight == "number")){
				overallScore += objectives[key].score * objectives[key].scoreWeight;
			}
		});
		return +(overallScore).toFixed(6);
	};

	var getHasScore = function(){
		return hasScore;
	};

	var getObjectives = function(){
		return objectives;
	};

	var getTimeSpent = function(){
		if(startTime instanceof Date){
			return ((new Date() - startTime)/1000);
		} else {
			return 0;
		}
	};


	/////////////
	// Helpers
	/////////////

	var _createObjectives = function(){
		var nExercises=0;

		var currentTest = C.CORE.getCurrentTest();
		if(typeof currentTest === "object"){
			//Create objectives for test
			for(var i=0; i<currentTest.parsed_exercises.length; i++){
				_createObjectiveForExercise(currentTest.parsed_exercises[i]);
				nExercises++;
			}
		} else {
			var currentExercise = C.CORE.getCurrentExercise();
			if(typeof currentExercise === "object"){
				//Create objective for exercise
				_createObjectiveForExercise(currentExercise);
				nExercises++;
			} else {
				//No exercises on this LO
				hasScore = false;
			}
		}

		//Fill completion weights and normalize completion and score weights
		var objectivesKeys = Object.keys(objectives);

		var scoreWeightSum = 0;
		objectivesKeys.forEach(function(key){ 
			if(typeof objectives[key].scoreWeight == "number"){
				//Calculate sum to normalize scoreWeight
				scoreWeightSum += objectives[key].scoreWeight;
			}
		});

		var exerciseCompletionWeight;
		if(nExercises > 0){
			exerciseCompletionWeight = (1/nExercises);
		} else {
			exerciseCompletionWeight = 1;
		}

		objectivesKeys.forEach(function(key){
			if(typeof objectives[key].completionWeight != "number"){
				objectives[key].completionWeight = exerciseCompletionWeight;
			} else {
				objectives[key].completionWeight *= exerciseCompletionWeight;
			}
			if(scoreWeightSum > 0){
				if(typeof objectives[key].scoreWeight == "number"){
					//Normalize scoreWeight
					objectives[key].scoreWeight = objectives[key].scoreWeight/scoreWeightSum;
				}
			}
		});
	};

	var _createObjectiveForExercise = function(exerciseJSON){
		if(typeof exerciseJSON.parsed_score_function === "function"){
			//LO with evaluation
			hasScore = true;

			//Create objective
			var scoreWeight = 10;
			//TODO. Replace weight based on weight settings.

			//'scoreWeight' is the 'score points' assigned to the exercise (10 by default). Later all these score weights will be normalized to sum to one.
			var exerciseObjective = new Objective(exerciseJSON.id,1,scoreWeight);
			objectives[exerciseObjective.id] = exerciseObjective;
		} else {
			var exerciseRelativeCompletionWeight = 1;

			if(typeof _getTLT(exerciseJSON) === "number"){
				// Create an objective that requires to spent a minimum time with the Exercise.
				var tltObjective = new Objective("TLT_for_exercise_" + (exerciseJSON.id).toString());
				tltObjective.completionWeight = 0.6;
				tltObjective.timeSpent = 0;
				exerciseRelativeCompletionWeight -= tltObjective.completionWeight;
				objectives[tltObjective.id] = tltObjective;
			}

			//Create objective without score weight
			var exerciseObjective = new Objective(exerciseJSON.id);
			exerciseObjective.completionWeight = exerciseRelativeCompletionWeight;
			objectives[exerciseObjective.id] = exerciseObjective;
		}

	};

	var _getTLT = function(exerciseJSON){
		if(typeof exerciseJSON.metadata == "object"){
			if(typeof exerciseJSON.metadata.TLT == "string"){
				var tltNumber = C.Utils.iso8601Parser.getDurationFromISO(exerciseJSON.metadata.TLT);
				if((typeof tltNumber == "number") && (!isNaN(tltNumber))){
					return tltNumber;
				}
			}
		}
	};


	/////////////
	// Constructors
	/////////////

	var Objective = function(id,completionWeight,scoreWeight){
		this.id = id;
		
		this.progress = 0;
		if(typeof completionWeight == "number"){
			this.completionWeight = completionWeight;
		}
		this.completed = false;

		this.score = undefined;
		if(typeof scoreWeight == "number"){
			this.scoreWeight = scoreWeight;
		}
		this.success = undefined;
	};


	return {
		init					: init,
		getProgressMeasure		: getProgressMeasure,
		getScore				: getScore,
		getHasScore				: getHasScore,
		getObjectives			: getObjectives,
		getTimeSpent			: getTimeSpent,
		onLoadExercise			: onLoadExercise,
		onDoCurrentExercise		: onDoCurrentExercise
	};

}) (CODEditor, jQuery);