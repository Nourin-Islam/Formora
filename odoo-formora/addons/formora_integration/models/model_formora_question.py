from odoo import models, fields

class FormQuestion(models.Model):
    _name = 'formora.question'
    _description = 'Formora Question'
    
    template_id = fields.Many2one('formora.template', string='Template')
    remote_id = fields.Integer(string='Remote Question ID')
    question_text = fields.Text(string='Question Text')
    question_type = fields.Selection([
        ('STRING', 'Text'),
        ('INTEGER', 'Number'),
        ('CHECKBOX', 'Multiple Choice'),
        ('TEXT', 'Long Text')
    ], string='Question Type')
    show_in_table = fields.Boolean(string='Show in Table')
    
    avg_value = fields.Float(string='Average')
    min_value = fields.Float(string='Minimum')
    max_value = fields.Float(string='Maximum')
    common_answers = fields.Text(string='Common Answers')