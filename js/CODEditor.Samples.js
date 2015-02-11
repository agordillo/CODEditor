CODEditor.Samples = (function(C,$,undefined){

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

	return {
		js_sample : js_sample
	};

}) (CODEditor,jQuery);