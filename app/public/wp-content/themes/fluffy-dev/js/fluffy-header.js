(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var pairings = [
			{
				wrapperId: 'fluffy-user-menu',
				triggerId: 'fluffy-user-menu-trigger',
				panelId: 'fluffy-user-dropdown',
			},
			{
				wrapperId: 'fluffy-mobile-menu',
				triggerId: 'fluffy-mobile-trigger',
				panelId: 'fluffy-mobile-drawer',
			},
		];

		var instances = [];

		pairings.forEach(function (cfg) {
			var wrapper = document.getElementById(cfg.wrapperId);
			var trigger = document.getElementById(cfg.triggerId);
			var panel = document.getElementById(cfg.panelId);
			if (!wrapper || !trigger || !panel) {
				return;
			}

			var close = function () {
				panel.classList.add('hidden');
				panel.style.display = 'none';
				trigger.setAttribute('aria-expanded', 'false');
			};

			var open = function () {
				panel.classList.remove('hidden');
				panel.style.display = 'block';
				trigger.setAttribute('aria-expanded', 'true');
			};

			// Ensure closed initially
			close();

			trigger.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				var isOpen = trigger.getAttribute('aria-expanded') === 'true';
				instances.forEach(function (inst) {
					inst.close();
				});
				if (!isOpen) {
					open();
				}
			});

			instances.push({ wrapper: wrapper, close: close });
		});

		document.addEventListener('click', function (e) {
			instances.forEach(function (inst) {
				if (!inst.wrapper.contains(e.target)) {
					inst.close();
				}
			});
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') {
				instances.forEach(function (inst) {
					inst.close();
				});
			}
		});
	});
})();
