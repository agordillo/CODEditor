CODEditor.Utils = (function(C,$,undefined){

	var init = function(options){
		_defineExtraFunctions();
	};

	var _defineExtraFunctions = function(){
		//Extend JQuery functionality
		jQuery.fn.cssNumber = function(prop){
			var v = parseInt(this.css(prop),10);
			return isNaN(v) ? 0 : v;
		};
	};

	var isCodeEmpty = function(code){
		if((typeof code != "string")||(code.trim()==="")){
			return true;
		}
		return false;
	};

	var getScoreFromScoreFunction = function(scoreFunction,response,variablesHash){
		var score;

		try {
			score = scoreFunction(response,variablesHash);
		} catch (e){ }

		var normalizedScore = {};
		normalizedScore.score = undefined;
		normalizedScore.successes = [];
		normalizedScore.errors = [];
		normalizedScore.feedback = [];

		if(typeof score == "number"){
			normalizedScore.score = score;
		} else if(typeof score == "object"){
			if(typeof score.score == "number"){
				normalizedScore.score = score.score;
			}
			if(score.successes instanceof Array){
				normalizedScore.successes = score.successes;
			}
			if(score.errors instanceof Array){
				normalizedScore.errors = score.errors;
			}
			if(score.feedback instanceof Array){
				normalizedScore.feedback = score.feedback;
			}
		}

		if(typeof normalizedScore.score == "number"){
			return normalizedScore;
		} else {
			return undefined;
		}
	};


	return {
		init 						: init,
		isCodeEmpty					: isCodeEmpty,
		getScoreFromScoreFunction 	: getScoreFromScoreFunction
	};

}) (CODEditor,jQuery);