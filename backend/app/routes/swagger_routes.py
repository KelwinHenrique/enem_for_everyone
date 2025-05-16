from flask import Blueprint, send_from_directory, render_template_string
import os

# Create blueprint
swagger_bp = Blueprint('swagger', __name__)

@swagger_bp.route('/docs', methods=['GET'])
def swagger_ui():
    """Serve Swagger UI page"""
    html_content = '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Alura Project API - Documentação</title>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
        <style>
            html {
                box-sizing: border-box;
                overflow: -moz-scrollbars-vertical;
                overflow-y: scroll;
            }
            
            *,
            *:before,
            *:after {
                box-sizing: inherit;
            }
            
            body {
                margin: 0;
                background: #fafafa;
            }
            
            .swagger-ui .topbar {
                background-color: #0A1B2A;
            }
            
            .swagger-ui .info .title {
                color: #0A1B2A;
            }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    url: "/v1/swagger.yaml",
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIBundle.SwaggerUIStandalonePreset
                    ],
                    layout: "BaseLayout",
                    defaultModelsExpandDepth: -1
                });
                window.ui = ui;
            };
        </script>
    </body>
    </html>
    '''
    return render_template_string(html_content)

@swagger_bp.route('/swagger.yaml', methods=['GET'])
def serve_swagger_file():
    """Serve the swagger.yaml file"""
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return send_from_directory(root_dir, 'swagger.yaml')
