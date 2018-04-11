define('Controls-demo/HighCharts/HighCharts',
   [
      'Core/Control',
      'tmpl!Controls-demo/HighCharts/HighCharts',
      'css!Controls-demo/HighCharts/HighCharts'
   ],
   function(Control, template) {
      return Control.extend({
         _template: template,
         need: true,
         toggleCaption: 'Убрать диаграмму',
         highChartOptions1: {
            chart: {
               type: 'line'
            },
            series: [{
               name: 'USD to EUR',
               data: [10, 20]
            }]
         },
         highChartOptions2: {
            chart: {
               type: 'pie'
            },
            series: [{
               name: 'USD to EUR',
               data: [10, 20]
            }]
         },
         changeHighChartOptions: function () {
            this.highChartOptions1 = {
               chart: {
                  type: 'line'
               },
               series: [{
                  name: 'USD to EUR',
                  data: [10, 20]
               }]
            };
         },
         toggleChart: function () {
            if (this.need) {
               this.toggleCaption = 'Показать диаграмму';
               this.need = false;
            } else {
               this.toggleCaption = 'Убрать диаграмму';
               this.need = true;
            }
         }
      });
   });
