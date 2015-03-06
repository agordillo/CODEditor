CODEditor.JS = (function(C,$,undefined){

	var init = function(options){
	};

	var runJavaScriptcode = function(jscode){

		//Check if an excercise is currently tried
		var variablesArray = undefined;
		var currentExercise = C.CORE.getCurrentExercise();
		if(typeof currentExercise !== "undefined"){
			variablesArray = currentExercise.score_function_vars;
		}


		//Execute the code
		var result;
		var evaluation = _evalJavaScriptCode(jscode,variablesArray);
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

				if((variablesArray instanceof Array)&&(variablesArray.length>0)){
					//Avoid 'undefined' outputs when the exercise is looking for vars.
					if(result==="undefined"){
						result = "";
					}
					for(var vai=0; vai<variablesArray.length; vai++){
						var varValue = evaluation.variablesHash[variablesArray[vai]];
						if(result!=""){
							result += "\n\n";
						}
						if(typeof varValue === "undefined"){
							result += "var " + variablesArray[vai] + " = undefined";
						} else {
							result += "var " + variablesArray[vai] + " = " + varValue.toString();
						}
					}
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
			if(typeof currentExercise !== "undefined"){
				if(typeof currentExercise.parsed_score_function == "function"){
					var score = C.Score.getScoreFromScoreFunction(currentExercise.parsed_score_function,evaluation.response,evaluation.variablesHash);
					C.Score.displayScore(score,wrapper);
					C.CORE.onDoCurrentExercise(score.score,wrapper);
				} else {
					C.CORE.onDoCurrentExercise(undefined,wrapper);
				}
			}
		} else {
			if(!C.Utils.isCodeEmpty(jscode)){
				C.Score.displayErrors(["Se produjo un error de ejecución."],wrapper);
			}
		}

		$("#preview").append(wrapper);
	};

	var _evalJavaScriptCode = function(jscode,variablesArray){
		var evaluation = {};
		evaluation.errors = [];
		evaluation.response = undefined;
		evaluation.variablesHash = {};

		//1. Check if jscode is a not empty string
		if(C.Utils.isCodeEmpty(jscode)){
			evaluation.errors.push("No ha enviado ningún código para ser ejecutado.");
			return evaluation;
		}

		//2. Check if the eval function stores any data in any of the variables defined in the variablesArray.
		var defaultVariablesArray = false;
		if(!(variablesArray instanceof Array)){
			variablesArray = ["result"];
			defaultVariablesArray = true;
		}
		var jsCodeEval = _evalInFunctionContextAndLookForVars(jscode,variablesArray);

		if(jsCodeEval[0]===true){
			if((defaultVariablesArray)&&(Object.keys(jsCodeEval[1]).indexOf("result") !== -1)){
				evaluation.response = jsCodeEval[1]["result"];
				// console.log("Result in Result Var");
				return evaluation;
			} else if(defaultVariablesArray===false) {
				evaluation.variablesHash = jsCodeEval[1];
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