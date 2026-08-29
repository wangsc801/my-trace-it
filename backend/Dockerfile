# Build: JDK 25 + project Maven wrapper (only-script, 自动下载 Maven 3.9.16)
FROM eclipse-temurin:25-jdk AS build
WORKDIR /src
COPY . .
RUN chmod +x mvnw && ./mvnw -q clean package -DskipTests

# Runtime
FROM eclipse-temurin:25-jdk
WORKDIR /app
COPY --from=build /src/target/my-trace-it-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8832
ENTRYPOINT ["java", "-jar", "app.jar"]