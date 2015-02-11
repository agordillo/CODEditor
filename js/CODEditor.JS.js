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
		var container = wrapper;
		if(hasErrors){
			$(wrapper).addClass("js_code_error");
		}
		$(wrapper).append("<pre></pre>");
		container = $(wrapper).find("pre");
		$(container).html(result);
		$("#preview").append(wrapper);
	};

	var _evalJavaScriptCode = function(jscode){
		var evaluation = {};
		evaluation.errors = [];
		evaluation.response = undefined;

		//1. Check if jscode is a not empty string
		if(CODEditor.Utils.isCodeEmpty(jscode)){
			evaluation.errors.push("No ha enviado ningún código para ser evaluado.");
			return evaluation;
		}

		//2. Check if the eval function stores any data in the 'result' var.
		var jsCodeEval = _evalInFunctionContextAndLookForVars(jscode,["result"]);

		if(jsCodeEval[0]===true){
			if(Object.keys(jsCodeEval[1]).indexOf("result") != -1){
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


	return {
		init 				: init,
		runJavaScriptcode	: runJavaScriptcode
	};

}) (CODEditor,jQuery);