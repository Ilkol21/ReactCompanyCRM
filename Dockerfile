FROM node:18

# Установка рабочего каталога
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json* ./
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Открываем порт
EXPOSE 5173

# Запускаем dev-сервер
CMD ["npm", "run", "dev", "--", "--host"]
