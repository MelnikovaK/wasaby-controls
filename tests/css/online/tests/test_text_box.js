

gemini.suite('SBIS3.CONTROLS.TextBox Online', function () {

    gemini.suite('base', function (test) {

        test.setUrl('/regression_text_box_online.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.box = find('[sbisname="TextBox 1"]');
                this.text_inpit = find('.controls-TextBox__fieldWrapper > input');
				actions.waitForElementToShow('[name="TextBox 2"]', 40000);
                this.focus_input = find('[name="TextBox 2"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.focus_input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.box);
            })

            .capture('texted', function (actions) {
                actions.sendKeys(this.text_inpit, 'tensor');
                actions.click(this.focus_input);
            })
    });

    gemini.suite('disabled_base', function (test) {

        test.setUrl('/regression_text_box_online.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
				actions.waitForElementToShow('[name="TextBox 2"]', 40000);
                this.focus_input = find('[name="TextBox 2"] input');
                actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('TextBox 1').setEnabled(false);
                });
            })

            .capture('plain')
			
			.capture('texted', function (actions) {
                actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('TextBox 1').setText('tensor');
                });
                actions.click(this.focus_input);
            })
    });

    gemini.suite('validation_error', function (test) {

        test.setUrl('/regression_text_box_online.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
				actions.waitForElementToShow('[name="TextBox 2"]', 40000);
                this.focus_input = find('[name="TextBox 2"] input');
				actions.click(this.focus_input);
            })

            .capture('plain', function (actions) {
                actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('TextBox 1').markControl();
                });
				actions.wait(500);				
				actions.mouseMove(this.focus_input);
            })
    });

    gemini.suite('with_placeholder', function (test) {

        test.setUrl('/regression_text_box_online_2.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                actions.waitForElementToShow('[name="TextBox 2"]', 40000);
                this.focus_input = find('[name="TextBox 2"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.focus_input);
            })
    });

    gemini.suite('text_transform_lowercase', function (test) {

        test.setUrl('/regression_text_box_online_3.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                actions.waitForElementToShow('[name="TextBox 2"]', 40000);
                this.focus_input = find('[name="TextBox 2"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.focus_input);
            })
    });

    gemini.suite('text_transform_uppercase', function (test) {

        test.setUrl('/regression_text_box_online_4.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                actions.waitForElementToShow('[name="TextBox 2"]', 40000);
                this.focus_input = find('[name="TextBox 2"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.focus_input);
            })
    });
});