CODEditor.Score = (function(C,$,undefined){

	var init = function(options){
	};

	var getScoreFromScoreFunction = function(scoreFunction,response,variablesHash){
		var score;

		try {
			score = scoreFunction(response,variablesHash);
		} catch (e){
			console.log(e.message)
		}

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

	var displayScore = function(score,screenDOM){
		if(typeof score == "object"){
			//Valid returned score object (may include feedback)

			$(screenDOM).addClass("result_wrapper");

			//Successes
			if((score.successes instanceof Array)&&(score.successes.length > 0)){
				$(screenDOM).append("<p class='separator'></p>");
				var successesWrapper = $("<div class='successes_wrapper'></div>");
				var successesHeader = $("<div class='successes_header output_header'></div>");
				var successesContentWrapper = $("<div class='successes_content_wrapper output_content_wrapper'></div>");
				var successesContent = $("<pre class='successes'></pre>");
				
				$(successesHeader).append("Aciertos");
				for(var s=0; s<score.successes.length; s++){
					$(successesContent).append("<img class='success_icon' src='img/success_icon.png'/>" + CODEditor.Utils.purgeTextString(score.successes[s]) + "\n");
				}

				$(successesContentWrapper).append(successesContent);
				$(successesWrapper).append(successesHeader);
				$(successesWrapper).append(successesContentWrapper);
				$(screenDOM).append(successesWrapper);
			}

			//Errors
			if((score.errors instanceof Array)&&(score.errors.length > 0)){
				$(screenDOM).append("<p class='separator'></p>");
				var errorsWrapper = $("<div class='errors_wrapper'></div>");
				var errorsHeader = $("<div class='errors_header output_header'></div>");
				var errorsContentWrapper = $("<div class='errors_content_wrapper output_content_wrapper'></div>");
				var errorsContent = $("<pre class='errors'></pre>");
				
				$(errorsHeader).append("Errores");
				for(var e=0; e<score.errors.length; e++){
					$(errorsContent).append("<img class='error_icon' src='img/error_icon.png'/>" + CODEditor.Utils.purgeTextString(score.errors[e]) + "\n");
				}

				$(errorsContentWrapper).append(errorsContent);
				$(errorsWrapper).append(errorsHeader);
				$(errorsWrapper).append(errorsContentWrapper);
				$(screenDOM).append(errorsWrapper);
			}

			//Feedback
			if((score.feedback instanceof Array)&&(score.feedback.length > 0)){
				$(screenDOM).append("<p class='separator'></p>");
				var feedbackWrapper = $("<div class='feedback_wrapper'></div>");
				var feedbackHeader = $("<div class='feedback_header output_header'></div>");
				var feedbackContentWrapper = $("<div class='feedback_content_wrapper output_content_wrapper'></div>");
				var feedbackContent = $("<pre class='feedback'></pre>");
				
				$(feedbackHeader).append("Feedback");
				for(var f=0; f<score.feedback.length; f++){
					$(feedbackContent).append(CODEditor.Utils.purgeTextString(score.feedback[f]) + "\n\n");
				}

				$(feedbackContentWrapper).append(feedbackContent);
				$(feedbackWrapper).append(feedbackHeader);
				$(feedbackWrapper).append(feedbackContentWrapper);
				$(screenDOM).append(feedbackWrapper);
			}

			//Overall score
			$(screenDOM).append("<p class='separator'></p>");
			$(screenDOM).append("<pre class='overall_score'></pre>");
			var overallScoreDOM = $(screenDOM).find("pre.overall_score");

			if(score.score >= 5){
				$(overallScoreDOM).addClass("passed");
				$(overallScoreDOM).append("¡La solución es correcta!\n");
				$(overallScoreDOM).append("Puntuación: <span class='overall_score'>" + score.score.toString() + "</span>/10");
			} else {
				$(overallScoreDOM).addClass("failed");
				$(overallScoreDOM).append("La solución no es correcta.");
			}
		}
	};

	var displayErrors = function(errors,screenDOM){
		$(screenDOM).append("<p class='separator'></p>");
		var errorsWrapper = $("<div class='errors_wrapper'></div>");
		var errorsHeader = $("<div class='errors_header output_header'></div>");
		var errorsContentWrapper = $("<div class='errors_content_wrapper output_content_wrapper'></div>");
		var errorsContent = $("<pre class='errors'></pre>");
		
		$(errorsHeader).append("Errores");
		for(var i=0; i<errors.length; i++){
			$(errorsContent).append(errors[i] + "\n");
		}

		$(errorsContentWrapper).append(errorsContent);
		$(errorsWrapper).append(errorsHeader);
		$(errorsWrapper).append(errorsContentWrapper);
		$(screenDOM).append(errorsWrapper);
	};


	return {
		init						: init,
		getScoreFromScoreFunction	: getScoreFromScoreFunction,
		displayScore				: displayScore,
		displayErrors				: displayErrors
	};

}) (CODEditor,jQuery);