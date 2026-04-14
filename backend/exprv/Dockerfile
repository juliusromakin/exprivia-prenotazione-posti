# Fase 1: Build con Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copia il file pom.xml e scarica le dipendenze (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia il codice sorgente e compila
COPY src ./src
RUN mvn clean package -DskipTests

# Fase 2: Immagine di esecuzione
FROM eclipse-temurin:17-jre-alpine
WORKDIR /backend

# Copia il jar generato dalla fase di build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 10010

# Comando di avvio
ENTRYPOINT ["java", "-jar", "app.jar"]