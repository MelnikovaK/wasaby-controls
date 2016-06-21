var gemini = require('gemini');

gemini.suite('SBIS3.CONTROLS.CompositeViewTable Online', function () {

    gemini.suite('base', function (test) {

        test.setUrl('/regression_composite_view_table_online.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[name="CompositeView 1"]', 40000);
                this.item4 = find('[data-id="4"]');
				this.item6 = find('[data-id="6"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
				this.input = find('[sbisname="TextBox 1"] input');				
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })

            .capture('hovered_item', function (actions) {
                actions.mouseMove(this.item4);
				actions.wait(500);
            })

            .capture('selected_item', function (actions) {
                actions.click(this.item6);
				actions.wait(500);
            })
    });
	
	gemini.suite('empty_data', function (test) {

        test.setUrl('/regression_composite_view_table_online_2.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[name="CompositeView 1"]', 40000);
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
				this.input = find('[sbisname="TextBox 1"] input');
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })
    });
	
    gemini.suite('disabled_empty_data', function (test) {

        test.setUrl('/regression_composite_view_table_online_2.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[name="CompositeView 1"]', 40000);
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
				this.input = find('[sbisname="TextBox 1"] input');
				actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('CompositeView 1').setEnabled(false);
                });
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })
    });
	
	gemini.suite('ellipsis_column', function (test) {

        test.setUrl('/regression_composite_view_table_online_4.html').setCaptureElements('.capture')

            .before(function (actions, find) {
                actions.waitForElementToShow('[name="CompositeView 1"]', 40000);
                this.item4 = find('[data-id="4"]');
				this.item6 = find('[data-id="6"]');
				actions.waitForElementToShow('[sbisname="TextBox 1"]', 40000);
				this.input = find('[sbisname="TextBox 1"] input');				
            })

            .capture('plain', function (actions) {
                actions.click(this.input);
            })
    });
});