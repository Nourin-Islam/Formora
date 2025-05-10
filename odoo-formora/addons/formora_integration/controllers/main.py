from odoo import http

class FormoraController(http.Controller):
    @http.route('/formora/status', type='json', auth='none')
    def status(self):
        return {'status': 'running'}