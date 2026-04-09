# Fase 1: Build con Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copia il file pom.xml e scarica le dipendenze
COPY pom.xml .
# Corretto: mvn invece di mvc
RUN mvn dependency:go-offline

# Copia il codice sorgente e compila
COPY src ./src
RUN mvn clean package -DskipTests

# Fase 2: Immagine di esecuzione
FROM eclipse-temurin:17-jre-alpine
WORKDIR /backend

# Copia il jar generato dalla fase di build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Comando di avvio
ENTRYPOINT ["java", "-jar", "app.jar"]