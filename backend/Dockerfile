FROM python:3.9-slim

WORKDIR /app

# Copiar arquivos de requisitos e instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o restante do código
COPY . .

# Expor a porta que o Flask usará
EXPOSE 5001

# Configurar variáveis de ambiente para produção
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=run.py
ENV FLASK_ENV=production

# Executar o aplicativo com gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:create_app()"]
