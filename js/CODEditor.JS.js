CODEditor.JS = (function(C,$,undefined){

	var init = function(options){
	};

	var runJavaScriptcode = function(jscode){
		var result;
		var evaluation = _evalJavaScriptCode(jscode);
		var hasErrors = (evaluation.errors.length > 0);

		if(hasErrors){
			result = evaluation.errors.join("\n");
		} else {
			try {
				if(typeof evaluation.response === "undefined"){
					result = "undefined";
				} else {
					result = evaluation.response.toString();
				}
			} catch(e){
				result = "Error: " + e.message;
			}
		}

		var wrapper = $("<div class='js_code'></div>");
		$(wrapper).append("<pre class='result'></pre>");
		var resultDOM = $(wrapper).find("pre.result");
		if(hasErrors){
			$(resultDOM).addClass("error");
		}
		$(resultDOM).html(result);

		if(!hasErrors){
			//Check if an exercise is currently tried
			var currentExercise = CODEditor.CORE.getCurrentExercise();
			if(typeof currentExercise !== "undefined"){
				if(typeof currentExercise.score_function == "function"){
					var score = CODEditor.Utils.getScoreFromScoreFunction(currentExercise.score_function,evaluation.response);
					if(typeof score == "object"){
						//Valid returned score object (may include feedback)

						//Successes
						if((score.successes instanceof Array)&&(score.successes.length > 0)){
							$(wrapper).append("<p class='separator'></p>");
							var successesWrapper = $("<div class='successes_wrapper'></div>");
							var successesHeader = $("<div class='successes_header output_header'></div>");
							var successesContentWrapper = $("<div class='successes_content_wrapper output_content_wrapper'></div>");
							var successesContent = $("<pre class='successes'></pre>");
							
							$(successesHeader).append("Aciertos");
							for(var s=0; s<score.successes.length; s++){
								$(successesContent).append("<img class='success_icon' src='img/success_icon.png'/>" + score.successes[s] + "\n");
							}

							$(successesContentWrapper).append(successesContent);
							$(successesWrapper).append(successesHeader);
							$(successesWrapper).append(successesContentWrapper);
							$(wrapper).append(successesWrapper);
						}

						//Errors
						if((score.errors instanceof Array)&&(score.errors.length > 0)){
							$(wrapper).append("<p class='separator'></p>");
							var errorsWrapper = $("<div class='errors_wrapper'></div>");
							var errorsHeader = $("<div class='errors_header output_header'></div>");
							var errorsContentWrapper = $("<div class='errors_content_wrapper output_content_wrapper'></div>");
							var errorsContent = $("<pre class='errors'></pre>");
							
							$(errorsHeader).append("Errores");
							for(var e=0; e<score.errors.length; e++){
								$(errorsContent).append("<img class='error_icon' src='img/error_icon.png'/>" + score.errors[e] + "\n");
							}

							$(errorsContentWrapper).append(errorsContent);
							$(errorsWrapper).append(errorsHeader);
							$(errorsWrapper).append(errorsContentWrapper);
							$(wrapper).append(errorsWrapper);
						}

						//Feedback
						if((score.feedback instanceof Array)&&(score.feedback.length > 0)){
							$(wrapper).append("<p class='separator'></p>");
							var feedbackWrapper = $("<div class='feedback_wrapper'></div>");
							var feedbackHeader = $("<div class='feedback_header output_header'></div>");
							var feedbackContentWrapper = $("<div class='feedback_content_wrapper output_content_wrapper'></div>");
							var feedbackContent = $("<pre class='feedback'></pre>");
							
							$(feedbackHeader).append("Feedback");
							for(var f=0; f<score.feedback.length; f++){
								$(feedbackContent).append(score.feedback[f] + "\n");
							}

							$(feedbackContentWrapper).append(feedbackContent);
							$(feedbackWrapper).append(feedbackHeader);
							$(feedbackWrapper).append(feedbackContentWrapper);
							$(wrapper).append(feedbackWrapper);
						}

						//Overall score
						$(wrapper).append("<p class='separator'></p>");
						$(wrapper).append("<pre class='overall_score'></pre>");
						var overallScoreDOM = $(wrapper).find("pre.overall_score");

						if(score.score >= 5){
							$(overallScoreDOM).addClass("passed");
							$(overallScoreDOM).append("¡La solución es correcta!\n");
							$(overallScoreDOM).append("Puntuación: <span class='overall_score'>" + score.score.toString() + "</span>/10");
						} else {
							$(overallScoreDOM).addClass("failed");
							$(overallScoreDOM).append("La solución no es correcta.");
						}
					}
				}
			}
		} else {
			if(!CODEditor.Utils.isCodeEmpty(jscode)){
				$(wrapper).append("<p class='separator'></p>");
				var errorsWrapper = $("<div class='errors_wrapper'></div>");
				var errorsHeader = $("<div class='errors_header output_header'></div>");
				var errorsContentWrapper = $("<div class='errors_content_wrapper output_content_wrapper'></div>");
				var errorsContent = $("<pre class='errors'></pre>");
				
				$(errorsHeader).append("Errores");
				$(errorsContent).append("Se produjo un error de ejecución." + "\n");

				$(errorsContentWrapper).append(errorsContent);
				$(errorsWrapper).append(errorsHeader);
				$(errorsWrapper).append(errorsContentWrapper);
				$(wrapper).append(errorsWrapper);
			}
		}

		$("#preview").append(wrapper);
	};

	var _evalJavaScriptCode = function(jscode){
		var evaluation = {};
		evaluation.errors = [];
		evaluation.response = undefined;

		//1. Check if jscode is a not empty string
		if(CODEditor.Utils.isCodeEmpty(jscode)){
			evaluation.errors.push("No ha enviado ningún código para ser ejecutado.");
			return evaluation;
		}

		//2. Check if the eval function stores any data in the 'result' var.
		var jsCodeEval = _evalInFunctionContextAndLookForVars(jscode,["result"]);

		if(jsCodeEval[0]===true){
			if(Object.keys(jsCodeEval[1]).indexOf("result") !== -1){
				evaluation.response = jsCodeEval[1]["result"];
				// console.log("Result in Result Var");
				return evaluation;
			}
		}


		//3. Try to get the result directly from the code.
		var jsCodeEval = _evalInFunctionContext(jscode);

		if(jsCodeEval[0]===true) {
			//Success, no exception

			if(typeof jsCodeEval[1] !== "undefined"){
				evaluation.response = jsCodeEval[1];
				// console.log("Result directly from code");
				return evaluation;
			}

		} else {
			//Fail, exception raised.

			//4. Check if jscode returns some value with a return statement.
			var jscode_wrappered = "var jsfunction = function(){\n" + jscode + "\n}; jsfunction;"
			var jsCodeWrapperedEval = _evalInFunctionContext(jscode_wrappered);

			if(jsCodeWrapperedEval[0]===true){
				//Success. No exception.
				try {
					evaluation.response = jsCodeWrapperedEval[1]();
					// console.log("Result from return statement");
					return evaluation;
				} catch (e){
					evaluation.errors.push("Error: " + e.message);
					return evaluation;
				}
			} else {
				//Fail, exception raised
				evaluation.errors.push("Error: " + jsCodeEval[1].message);
				return evaluation;
			}
		}

		evaluation.errors.push("No se encontró ningún resultado.\nIncluya una sentencia 'return' o almacene el resultado en una variable de nombre 'result'.");
		return evaluation;
	};

	var _evalInFunctionContext = function(evalInFunctionContext_codeToEval){
		try {
			return [true, eval(evalInFunctionContext_codeToEval)];
		} catch (e){
			return [false,e];
		}
	};

	var _evalInFunctionContextAndLookForVars = function(evalInFunctionContext_codeToEval,evalInFunctionContext_varname_array){
		var evalInFunctionContext_varhash = {};

		try {
			for(var evalInFunctionContext_i=0; evalInFunctionContext_i<evalInFunctionContext_varname_array.length; evalInFunctionContext_i++){
				window["evalInFunctionContext_original_" + evalInFunctionContext_varname_array[evalInFunctionContext_i]] = evalInFunctionContext_varname_array[evalInFunctionContext_i] + "_" + Math.random()*Math.pow(10,10);
				eval("var " + evalInFunctionContext_varname_array[evalInFunctionContext_i] + " = '" + window["evalInFunctionContext_original_" + evalInFunctionContext_varname_array[evalInFunctionContext_i]] + "'");

				eval(evalInFunctionContext_codeToEval);

				if(eval(evalInFunctionContext_varname_array[evalInFunctionContext_i]) !== window["evalInFunctionContext_original_" + evalInFunctionContext_varname_array[evalInFunctionContext_i]]){
					evalInFunctionContext_varhash[evalInFunctionContext_varname_array[evalInFunctionContext_i]] = eval(evalInFunctionContext_varname_array[evalInFunctionContext_i]);
				}
			}
			return [true, evalInFunctionContext_varhash];
		} catch (e){
			return [false,e];
		}
	};

	var validateScoreFunction = function(jscode){
		var evaluation = {};
		evaluation.errors = [];
		evaluation.response = undefined;

		//Check if the eval function stores any data in the 'score' var.
		var jsCodeEval = _evalInFunctionContextAndLookForVars(jscode,["score"]);

		if(jsCodeEval[0]===true){
			if(Object.keys(jsCodeEval[1]).indexOf("score") !== -1){
				evaluation.response = jsCodeEval[1]["score"];
			} else {
				evaluation.errors.push("Error: No 'score' var found.")
			}
		} else {
			//Fail, exception raised
			evaluation.errors.push("Error: " + jsCodeEval[1].message);
		}
		return evaluation;
	};


	return {
		init 					: init,
		runJavaScriptcode		: runJavaScriptcode,
		validateScoreFunction	: validateScoreFunction
	};

}) (CODEditor,jQuery);