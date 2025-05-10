from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError

class FormoraImportWizard(models.TransientModel):
    _name = 'formora.import.wizard'
    _description = 'Formora Import Wizard'
    
    api_token = fields.Char(string='API Token', required=True)
    template_id = fields.Integer(
        string='Template ID',
        help="Leave empty to import all templates for this user"
    )
    
    @api.constrains('template_id')
    def _check_template_id(self):
        for record in self:
            if record.template_id and record.template_id <= 0:
                raise ValidationError(_("Template ID must be a positive number"))
    
    def action_import(self):
        self.ensure_one()
        if not self.api_token:
            raise UserError(_('API Token is required'))
            
        templates = self.env['formora.template'].search([])
        templates.import_data(self.api_token, self.template_id or False)
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Success'),
                'message': _('Data imported successfully'),
                'sticky': False,
                'next': {'type': 'ir.actions.act_window_close'},
            }
        }