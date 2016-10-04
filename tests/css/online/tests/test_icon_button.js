gemini.suite('SBIS3.CONTROLS.IconButton Online', function () {

    gemini.suite('base', function (test) {

        test.setUrl('/regression_icon_button_online.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })

            .capture('actived', function (actions) {
                actions.mouseDown(this.icon_button);
            })

            .after(function (actions) {
                actions.mouseUp(this.icon_button);
            })
    });

    gemini.suite('round_border_plus', function (test) {

        test.setUrl('/regression_icon_button_online_7.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })

            .capture('actived', function (actions) {
                actions.mouseDown(this.icon_button);
            })

            .after(function (actions) {
                actions.mouseUp(this.icon_button);
            })
    });

    gemini.suite('round_border', function (test) {

        test.setUrl('/regression_icon_button_online_3.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })

            .capture('actived', function (actions) {
                actions.mouseDown(this.icon_button);
            })

            .after(function (actions) {
                actions.mouseUp(this.icon_button);
            })
    });

    gemini.suite('disabled_round_border', function (test) {

        test.setUrl('/regression_icon_button_online_3.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
                actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('IconButton 1').setEnabled(false);
                });
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })
    });

    gemini.suite('with_icon24', function (test) {

        test.setUrl('/regression_icon_button_online_4.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })

            .capture('actived', function (actions) {
                actions.mouseDown(this.icon_button);
            })

            .after(function (actions) {
                actions.mouseUp(this.icon_button);
            })
    });

    gemini.suite('disabled_with_icon24', function (test) {

        test.setUrl('/regression_icon_button_online_4.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
                actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('IconButton 1').setEnabled(false);
                });
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })
    });

    gemini.suite('round_border_with_icon24', function (test) {

        test.setUrl('/regression_icon_button_online_6.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })

            .capture('actived', function (actions) {
                actions.mouseDown(this.icon_button);
            })

            .after(function (actions) {
                actions.mouseUp(this.icon_button);
            })
    });

    gemini.suite('disabled_round_border_with_icon24', function (test) {

        test.setUrl('/regression_icon_button_online_6.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[name="IconButton 1"]', 40000);
                this.icon_button = find('[name="IconButton 1"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
                this.input = find('[sbisname="TextBox 1"] input');
                actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('IconButton 1').setEnabled(false);
                });
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered', function (actions) {
                actions.mouseMove(this.icon_button);
            })
    });
});