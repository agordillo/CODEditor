/*
 * Track the progress of a learner during a session.
 * Used by the SCORM API.
 */
CODEditor.ProgressTracking = (function(C,$,undefined){

	//Constants
	var SCORE_THRESHOLD = 0.5;

	//Auxiliar vars
	var objectives = {};
	var hasScore = false;

	var minimumTLT = 60;
	var startTime;


	var init = function(animation,callback){
		_createObjectives();

		startTime = new Date();

		if (typeof objectives["average_time"] == "object"){
			setTimeout(function(){
				objectives["average_time"].completed = true;
				objectives["average_time"].progress = 1;
			},_getTLT()*1000);
		}
	};


	/* Events */

	var onDoCurrentExercise = function(score){
		var currentExercise = CODEditor.CORE.getCurrentExercise();
		if((typeof currentExercise == "object")&&(typeof currentExercise.id == "number")){
			if(typeof objectives[currentExercise.id] == "object"){
				objectives[currentExercise.id].progress = 1;
				objectives[currentExercise.id].completed = true;
				//objectives[currentExercise.id].score should be a score in a 0-1 scale.
				//score is a number in a 0-10 scale.
				var scaledScore = score/10;
				objectives[currentExercise.id].score = score/10;
				if(scaledScore >= SCORE_THRESHOLD){
					objectives[currentExercise.id].success = true;
				} else {
					objectives[currentExercise.id].success = false;
				}
			}

			CODEditor.SCORM.onProgressObjectiveUpdated(objectives[currentExercise.id]);
		}
	};


	/* Module Methods */

	var _getTLT = function(){
		return minimumTLT;
	};

	//Return a value in a [0,1] scale
	var getProgressMeasure = function(){
		if (typeof objectives["average_time"] == "object"){
			// Adjust average_time progress if is not 100%
			if (objectives["average_time"].progress<1){
				objectives["average_time"].progress = Math.min(1,getTimeSpent()/_getTLT());
			}
		}

		var overallProgressMeasure = 0;
		Object.keys(objectives).forEach(function(key){
			overallProgressMeasure += objectives[key].progress * objectives[key].completionWeight;
		});

		return +(overallProgressMeasure).toFixed(6);
	};

	//Return a value in a [0,1] scale
	var getScore = function(){
		var overallScore = 0;
		Object.keys(objectives).forEach(function(key){
			if(typeof objectives[key].score == "number"){
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
		var currentTest = CODEditor.CORE.getCurrentTest();
		if(typeof currentTest === "object"){
			//Create objectives for test
			for(var i=0; i<currentTest.parsed_exercises.length; i++){
				_createObjectiveForExercise(currentTest.parsed_exercises[i]);
			}
		} else {
			var currentExercise = CODEditor.CORE.getCurrentExercise();
			if(typeof currentExercise === "object"){
				//Create objective for exercise
				_createObjectiveForExercise(currentExercise);
			} else {
				//No exercises on this LO
				hasScore = false;
			}
		}

		if(hasScore === false){
			// Create an objective that requires to spent a minimum time with the LO.
			var timeObjective = new Objective("average_time");
			timeObjective.completionWeight = 1;
			objectives[timeObjective.id] = timeObjective;
		}

		//Fill completion weights and normalize score weights
		var objectivesKeys = Object.keys(objectives);
		var nObjectives = objectivesKeys.length;

		var definedCompletionWeights = 0;
		var completionWeightSum = 0;
		var scoreWeightSum = 0;

		objectivesKeys.forEach(function(key){ 
			if(typeof objectives[key].completionWeight == "number"){
				completionWeightSum += objectives[key].completionWeight;
				definedCompletionWeights += 1;
			}
			if(typeof objectives[key].scoreWeight == "number"){
				//Calculate sum to normalize scoreWeight
				scoreWeightSum += objectives[key].scoreWeight;
			}
		});

		var defaultCompletionWeight;
		if((nObjectives-definedCompletionWeights) > 0){
			defaultCompletionWeight = (1-completionWeightSum)/(nObjectives-definedCompletionWeights);
		} else {
			defaultCompletionWeight = 1;
		}

		objectivesKeys.forEach(function(key){
			if(typeof objectives[key].completionWeight != "number"){
				objectives[key].completionWeight = defaultCompletionWeight;
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
			var exerciseObjective = new Objective(exerciseJSON.id,undefined,scoreWeight);
			objectives[exerciseObjective.id] = exerciseObjective;
		}
	};


	/////////////
	// Constructors
	/////////////

	var Objective = function(id,completionWeight,scoreWeight){
		this.id = id;
		this.completed = false;
		this.progress = 0;
		this.score = undefined;
		this.success = undefined;
		if(typeof completionWeight == "number"){
			this.completionWeight = completionWeight;
		}
		if(typeof scoreWeight == "number"){
			this.scoreWeight = scoreWeight;
		}
	};


	return {
		init					: init,
		getProgressMeasure		: getProgressMeasure,
		getScore				: getScore,
		getHasScore				: getHasScore,
		getObjectives			: getObjectives,
		getTimeSpent			: getTimeSpent,
		onDoCurrentExercise		: onDoCurrentExercise
	};

}) (CODEditor, jQuery);