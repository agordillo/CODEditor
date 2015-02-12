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
		"description":"Escribe 'Hello World'.",
		"editorMode":"JavaScript",
		"content": "/*\n * Escribe \"Hello World\" y ejecuta el código.\n */\n ",
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
			grade.feedback.push("Debes escribir \"Hello World\" o 'Hello World' y ejecutar el código.");
		}
		return grade;
	};

	var js_sample_feedback = {
		"type": "exercise",
		"title": "Hello World con feedback",
		"description":"Escribe 'Hello World'.",
		"editorMode":"JavaScript",
		"content": "/*\n * Escribe \"Hello World\" y ejecuta el código.\n */\n ",
		"score_function": ("var score = " + js_sample_feedback_score.toString())
	};


	var getExample = function(exampleName){
		//TODO
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