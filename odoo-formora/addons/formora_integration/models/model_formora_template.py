from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError
import requests
import json
from statistics import mean
from collections import Counter

class FormTemplate(models.Model):
    _name = 'formora.template'
    _description = 'Formora Template'
    
    remote_id = fields.Integer(string='Remote Template ID')
    title = fields.Char(string='Title', required=True)
    author = fields.Char(string='Author')
    user_id = fields.Many2one('res.users', string='Odoo User')
    question_ids = fields.One2many('formora.question', 'template_id', string='Questions')
    last_sync = fields.Datetime(string='Last Synchronization')
    api_token = fields.Char(string='API Token', help="Token used for API authentication")
    
    def import_data(self, api_token, template_id=False):
        """Import data from Formora API
        
        Args:
            api_token (str): The API token for authentication
            template_id (int, optional): Specific template ID to import. 
                                      If False, imports all templates for the user.
        """
        base_url = 'https://taskseven-lmgn.onrender.com/api/odoo'
        
        try:
            url = f'{base_url}?apiToken={api_token}'
            if template_id:
                url += f'&templateId={template_id}'
                
            response = requests.get(url, timeout=100)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            raise UserError(_('Failed to fetch data from Formora API: %s') % str(e))
        
        if not data:
            raise UserError(_('No data found for the specified criteria'))
        
        template_data = {}
        for item in data:
            if item['templateId'] not in template_data:
                template_data[item['templateId']] = []
            template_data[item['templateId']].append(item)
        
        for template_id, responses in template_data.items():
            template = self._get_or_create_template(template_id, responses[0]['user_name'])
            self._process_responses(template, responses)
            template.write({
                'last_sync': fields.Datetime.now(),
                'api_token': api_token
            })

    def _get_or_create_template(self, template_id, author_name):
        """Get existing template or create new one"""
        template = self.search([('remote_id', '=', template_id)], limit=1)
        
        if not template:
            template = self.create({
                'remote_id': template_id,
                'title': f'Template {template_id}',
                'author': author_name,
                'user_id': self.env.user.id
            })
        return template

    def _process_responses(self, template, responses):
        """Process all responses for a template"""
        questions = {}
        for response in responses:
            q_id = response['question_id']
            if q_id not in questions:
                questions[q_id] = {
                    'text': response['question_title'],
                    'type': response['question_type'],
                    'show_in_table': response['show_in_table'],
                    'answers': []
                }
            questions[q_id]['answers'].append(response['answer'])
        
        for q_id, q_data in questions.items():
            self._process_question(template, q_id, q_data)

    def _process_question(self, template, q_id, q_data):
        """Process individual question data"""
        question = self.env['formora.question'].search([
            ('template_id', '=', template.id),
            ('remote_id', '=', q_id)
        ], limit=1)
        
        if not question:
            question = self.env['formora.question'].create({
                'template_id': template.id,
                'remote_id': q_id,
                'question_text': q_data['text'],
                'question_type': q_data['type'],
                'show_in_table': q_data['show_in_table']
            })
        
        # Calculate statistics based on question type
        if q_data['type'] == 'INTEGER':
            self._process_numeric_question(question, q_data['answers'])
        elif q_data['type'] in ['STRING', 'TEXT']:
            self._process_text_question(question, q_data['answers'])
        elif q_data['type'] == 'CHECKBOX':
            self._process_checkbox_question(question, q_data['answers'])

    def _process_numeric_question(self, question, answers):
        """Calculate statistics for numeric questions"""
        numbers = [int(a) for a in answers if str(a).isdigit()]
        if numbers:
            question.write({
                'avg_value': mean(numbers),
                'min_value': min(numbers),
                'max_value': max(numbers),
                'common_answers': False
            })

    def _process_text_question(self, question, answers):
        """Calculate statistics for text questions"""
        counter = Counter(answers)
        common = counter.most_common(3)
        question.write({
            'common_answers': ', '.join([f"{ans[0]} ({ans[1]})" for ans in common]),
            'avg_value': 0,
            'min_value': 0,
            'max_value': 0
        })

    def _process_checkbox_question(self, question, answers):
        """Calculate statistics for checkbox questions"""
        all_choices = []
        for ans in answers:
            try:
                choices = json.loads(ans)
                all_choices.extend(choices)
            except:
                continue
                
        counter = Counter(all_choices)
        common = counter.most_common(3)
        question.write({
            'common_answers': ', '.join([f"{ans[0]} ({ans[1]})" for ans in common]),
            'avg_value': 0,
            'min_value': 0,
            'max_value': 0
        })