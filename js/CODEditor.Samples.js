CODEditor.Samples = (function(C,$,undefined){

	/* Example 1*/
	var js_sample_score = function(result){
		if(result=='Hello World'){
			return 10;
		} else {
			return 0;
		}
	};

	var js_sample = {
		"type": "exercise",
		"title": "Hello World",
		"description":"Escriba 'Hello World'.",
		"editorMode":"JavaScript",
		"content": "/*\n * Escriba \"Hello World\" y ejecute el código.\n */\n ",
		"score_function": ("var score = " + js_sample_score.toString())
	};


	/* Example 2*/
	var js_sample_feedback_score = function(result){
		var grade = {};
		grade.successes = [];
		grade.errors = [];
		grade.feedback = [];

		if(result=='Hello World'){
			grade.score = 10;
			grade.successes.push("Escribiste bien 'Hello World'.");
			grade.feedback.push("¡Muy bien!");
		} else if((typeof result == "string")&&(result.toLowerCase()==='Hello World'.toLowerCase())){
			grade.score = 5;
			grade.successes.push("Escribiste 'Hello World'.");
			grade.feedback.push("Recuerda que JavaScript es sensible a maýusculas. No es lo mismo 'Hello World' que 'HELLO WORLD'.");
		} else {
			grade.score = 0;
			grade.errors.push("El valor devuelto no era exactamente 'Hello World'.");
			grade.feedback.push("Debe escribir \"Hello World\" o 'Hello World' y ejecutar el código.");
		}
		return grade;
	};

	var js_sample_feedback = {
		"type": "exercise",
		"title": "Hello World con feedback",
		"description":"Escriba 'Hello World'.",
		"editorMode":"JavaScript",
		"content": "/*\n * Escriba \"Hello World\" y ejecute el código.\n */\n ",
		"score_function": ("var score = " + js_sample_feedback_score.toString())
	};


	/* Example 3*/
	var js_sample_multivar_score = function(result,variablesHash){
		var grade = {};
		grade.successes = [];
		grade.errors = [];
		grade.feedback = [];
		grade.score = 0;

		var a = variablesHash["a"];
		var b = variablesHash["b"];

		if(typeof a !== "string"){
			grade.errors.push("El valor devuelto en la variable 'a' no es una string.");
		} else {
			grade.score += 1;
			if(a==='Hello World'){
				grade.successes.push("Se definió 'Hello World' en la variable 'a'.");
				grade.score += 1;
			}
		}

		if(typeof b !== "function"){
			grade.errors.push("El valor devuelto en la variable 'b' no es una función.");
		} else {
			grade.score += 1;

			//Testear la función.
			try {
				var testA = b("Perro");
				if(testA==="perro"){
					grade.score += 2;
					grade.successes.push("La función definida en 'b' funciona correctamente para palabras simples.");
				} else {
					grade.errors.push("La función definida en 'b' no funciona correctamente para palabras simples.");
				}

				try {
					b(undefined);
					b(null);
					b("");
					b(8);
					grade.score += 2;
					grade.successes.push("La función definida en 'b' gestiona correctamente valores de entrada erróneos.");
				} catch(e){
					grade.errors.push("La función definida en 'b' no gestiona correctamente valores de entrada erróneos.");
					grade.feedback.push("Recuerde tomar en consideración los casos en los que la variable de entrada de una función pueda ser 'undefined', 'null', u otros valores no esperados.");
				}

				try {
					var testB = b("Mi Gato COME cOmIdA de gat0");
					if(testB === "mi gato come comida de gat0"){
						grade.score += 3;
						grade.successes.push("La función definida en 'b' funciona correctamente para frases.");
					} else {
						grade.errors.push("La función definida en 'b' no funciona correctamente para frases.");
					}
				} catch(e) {
					grade.errors.push("La función definida en 'b' no gestiona correctamente valores de entrada erróneos.");
					grade.feedback.push("Recuerde tomar en consideración los casos en los que la variable de entrada de una función pueda ser 'undefined', 'null', u otros valores no esperados.");
				}

			} catch(e) {
				grade.errors.push("La función 'b' presenta errores de ejecución.");
			}
		}

		if(grade.score===10){
			grade.feedback.push("¡Enhorabuena, tu solución es perfecta!");
		}

		return grade;
	};

	var js_sample_multivar = {
		"type": "exercise",
		"title": "Ejercicio con varias variables",
		"description":"Devuelva en la variable <b>'a'</b> la palabra 'Hello World', y en la variable <b>'b'</b> una función que reciba como parámetro una string y la pase a minúsculas.",
		"editorMode":"JavaScript",
		"content": "/*\n * " +  "Devuelva en la variable 'a' la palabra 'Hello World', y en la variable 'b' una función que reciba como parámetro una string y la pase a minúsculas." + "\n */\n\n" + "var a;\n\nvar b = function(str){\n\n};\n",
		"score_function": ("var score = " + js_sample_multivar_score.toString()),
		"score_function_vars": ["a","b"]
	};


	var getExample = function(exampleName){
		var example = undefined;
		try {
			eval("var example = " + exampleName);
		} catch(e) {}
		return example;
	};

	var getExamples = function(){
		var examples = [];
		examples.push(js_sample);
		examples.push(js_sample_feedback);
		return examples;
	};

	return {
		getExample  : getExample,
		getExamples : getExamples
	};

}) (CODEditor,jQuery);