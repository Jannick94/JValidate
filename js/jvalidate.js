$(function() {

	$.fn.jvalidate = function(options) {

		var settings = $.extend({
			validColor: '#43A047',
			errorColor: '#E53935'
		}, options);

		var validation,
			input,
			elem,
			validationValue,
			switchCase,
			args;

		this.serialize();

		this.find('input').each(function(key, element) {
			
			input = $(element);

			input.on('keyup blur', function() {
				
				validation = $(this).data('validation').split('|');
				elem       = $(this);

				$.each(validation, function(key, value) {
					
					args            = [];
					validationValue = value.split(':');
					switchCase      = validationValue[0];

					if (validationValue.length > 1) {
						args = validationValue.shift();
					}

					switch(switchCase) {
						case 'required':

							if ($.trim(elem.val()).length === 0) {
								elem.addClass('has-error').removeClass('is-valid');
								isValid = false;
							} else {
								elem.removeClass('has-error').addClass('is-valid');
								isValid = true;
							}
							break;

						case 'iban':
							
							if(!IBAN.isValid(elem.val())) {
								elem.addClass('has-error').removeClass('is-valid');
								isValid = false;
							} else {
								elem.removeClass('has-error').addClass('is-valid');
								isValid = true;
							}

							break;
						case 'number': 

							if(!$.isNumeric(elem.val())) {
								elem.addClass('has-error').removeClass('is-valid');
								isValid = false;
							} else {
								elem.removeClass('has-error').addClass('is-valid');
								isValid = true;
							}

							break;
						case 'min':

							console.log(args);

							break;
						default: 
							//Default
							break;
					}
				});
			});

		});
		
		this.on('submit', function(e) {
			if (!isValid) {
				e.preventDefault();
				console.log('submit canceled');
			}
		});

	};

}(jQuery));