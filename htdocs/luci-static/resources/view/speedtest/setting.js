/* This is free software, licensed under the Apache License, Version 2.0
 *
 * Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>
 */

'use strict';
'require view';
'require form';
'require ui';
'require fs';

return view.extend({
	render: function() {
		var m, s, o;
		m = new form.Map('speedtest', _('Speedtest'),
			_('Here you can perform a speed test to measure the basic aspects of your network connection.'));
		s = m.section(form.NamedSection, 'schedule', 'speedtest', _('Schedule'),
			_('Set up Speedtest to run according to scheduled times.'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enable', _('Enable'),
			_('Enable or disable service.'));
		o.rmempty = false;
		o.default = o.disabled;
		o = s.option(form.MultiValue, 'days', _('Days of Week'),
			_('Select days of week to run Speedtest.'));
		o.rmempty = false;
		o.value('1', _('Monday'));
		o.value('2', _('Tuesday'));
		o.value('3', _('Wednesday'));
		o.value('4', _('Thursday'));
		o.value('5', _('Friday'));
		o.value('6', _('Saturday'));
		o.value('7', _('Sunday'));
		o = s.option(form.ListValue, 'start', _('Start time'),
			_('Specify start time for Speedtest.'));
		o.rmempty = false;
		for (var hour = 0; hour < 24; hour++) {
			var time = ('0' + hour).slice(-2) + ':00';
			o.value(hour, time);
		};
		o = s.option(form.ListValue, 'stop', _('Stop time'),
			_('Specify stop time for Speedtest.'));
		o.rmempty = false;
		for (var hour = 0; hour < 24; hour++) {
			var time = ('0' + hour).slice(-2) + ':00';
			o.value(hour, time);
		};
		o = s.option(form.Value, 'frequency', _('Frequency (minutes)'),
			_('Specify how often the speed test should run, with a maximum of once per hour.'));
		o.rmempty = false;
		o.placeholder = _('Enter minutes (1-60)');
		o.validate = function(section_id, value) {
			var validate = /^([1-9]|[1-5][0-9]|60)$/;
			if (!validate.test(value)) {
				return _('The frequency must be between 1 and 60 minutes.');
			};
			return true;
		};
		o = s.option(form.ListValue, 'test', _('Test type'),
			_('Specify test type for Speedtest.'));
		o.rmempty = false;
		o.value('all', _('All'));
		o.value('latency', _('Latency'));
		o.value('download', _('Download Speed'));
		o.value('upload', _('Upload Speed'));
		return m.render();
	},
	handleSaveApply: function(ev, mode) {
		return this.handleSave(ev).then(function() {
			ui.changes.apply(mode == '0');
			return setTimeout(function() {
				fs.exec('/usr/share/speedtest/schedule', ['update']);
			}, 1000);
		});
	}
});
