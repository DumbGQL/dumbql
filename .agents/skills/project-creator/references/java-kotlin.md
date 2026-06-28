# Java / Kotlin + Spring Boot Reference

---

## Interview questions

Ask grouped:
- Java or Kotlin? (default: Kotlin — less boilerplate, Spring Boot 3 first-class support)
- Build tool: Gradle (Kotlin DSL) or Maven? (default: Gradle + Kotlin DSL)
- Spring Boot version? (default: latest stable — research before answering)
- Primary task: REST API / gRPC / messaging / batch / reactive?
- Database? (PostgreSQL → Spring Data JPA + Flyway, MongoDB → Spring Data Mongo, none → skip)
- Auth? (Spring Security + JWT / OAuth2 / none)
- Java version? (default: 21 LTS)

---

## Structure (Kotlin + Gradle, Spring Boot)

```
<project>/
├── src/
│   ├── main/
│   │   ├── kotlin/com/<company>/<project>/
│   │   │   ├── <Project>Application.kt      # @SpringBootApplication
│   │   │   ├── config/                       # @Configuration classes
│   │   │   ├── domain/
│   │   │   │   ├── model/                    # entities, value objects
│   │   │   │   └── repository/               # repository interfaces
│   │   │   ├── application/
│   │   │   │   └── service/                  # business logic, use cases
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/              # JPA implementations
│   │   │   │   └── web/
│   │   │   │       ├── controller/           # @RestController
│   │   │   │       ├── dto/                  # request/response DTOs
│   │   │   │       └── mapper/               # entity <-> DTO
│   │   │   └── common/
│   │   │       ├── exception/                # custom exceptions, handlers
│   │   │       └── extension/               # Kotlin extension functions
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── db/migration/                 # Flyway migrations
├── src/test/
│   └── kotlin/com/<company>/<project>/
│       ├── integration/                      # @SpringBootTest
│       └── unit/                             # pure unit tests
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/
│   └── wrapper/
├── .editorconfig
├── .gitignore
└── README.md
```

---

## build.gradle.kts baseline

```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.3.0"
    id("io.spring.dependency-management") version "1.1.5"
    id("org.jlleitschuh.gradle.ktlint") version "12.1.1"
    kotlin("jvm") version "2.0.0"
    kotlin("plugin.spring") version "2.0.0"
    kotlin("plugin.jpa") version "2.0.0"
}

group = "com.<company>"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.flywaydb:flyway-core")

    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
}

tasks.withType<KotlinCompile> {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

---

## Linting — ktlint

```bash
./gradlew ktlintCheck   # check
./gradlew ktlintFormat  # autofix
```

`.editorconfig` (ktlint reads this):
```ini
[*.{kt,kts}]
indent_size = 4
max_line_length = 120
ktlint_standard_no-wildcard-imports = enabled
ktlint_standard_trailing-comma-on-call-site = enabled
ktlint_standard_trailing-comma-on-declaration-site = enabled
```

---

## Kotlin patterns for Spring Boot

### Data classes for DTOs (never entities)

```kotlin
// ✅ DTO — data class is fine
data class CreateUserRequest(
    @field:NotBlank val name: String,
    @field:Email val email: String,
)

data class UserResponse(
    val id: Long,
    val name: String,
    val email: String,
)

// ✅ Entity — regular class (JPA needs mutable, no-arg constructor)
@Entity
@Table(name = "users")
class User(
    @Column(nullable = false)
    var name: String,

    @Column(nullable = false, unique = true)
    var email: String,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
)
```

### Sealed classes for results (no exceptions for control flow)

```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val cause: Throwable? = null) : Result<Nothing>()
}

// Service
fun findUser(id: Long): Result<UserResponse> =
    userRepository.findByIdOrNull(id)
        ?.let { Result.Success(it.toResponse()) }
        ?: Result.Error("User $id not found")

// Controller
@GetMapping("/{id}")
fun getUser(@PathVariable id: Long): ResponseEntity<UserResponse> =
    when (val result = userService.findUser(id)) {
        is Result.Success -> ResponseEntity.ok(result.data)
        is Result.Error -> ResponseEntity.notFound().build()
    }
```

### Extension functions for mapping (no MapStruct needed in Kotlin)

```kotlin
fun User.toResponse() = UserResponse(
    id = id,
    name = name,
    email = email,
)

fun CreateUserRequest.toEntity() = User(
    name = name,
    email = email,
)
```

### Constructor injection only — never field injection

```kotlin
// ❌ Bad — field injection
@Service
class UserService {
    @Autowired
    private lateinit var userRepository: UserRepository
}

// ✅ Good — constructor injection (Kotlin primary constructor)
@Service
class UserService(
    private val userRepository: UserRepository,
) {
    fun findUser(id: Long): UserResponse? =
        userRepository.findByIdOrNull(id)?.toResponse()
}
```

### application.yml over application.properties

```yaml
spring:
  application:
    name: <project>
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USER}
    password: ${DATABASE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate    # never create/update in prod — use Flyway
    show-sql: false
  flyway:
    enabled: true

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
```

---

## Testing conventions

### Unit tests — plain JUnit 5 + MockK (Kotlin-native mocking)

```kotlin
// build.gradle.kts — add MockK
testImplementation("io.mockk:mockk:1.13.11")

// Unit test
class UserServiceTest {
    private val userRepository = mockk<UserRepository>()
    private val userService = UserService(userRepository)

    @Test
    fun `findUser returns response when user exists`() {
        val user = User(name = "Alice", email = "alice@example.com", id = 1L)
        every { userRepository.findByIdOrNull(1L) } returns user

        val result = userService.findUser(1L)

        assertThat(result).isEqualTo(UserResponse(id = 1L, name = "Alice", email = "alice@example.com"))
    }

    @Test
    fun `findUser returns null when user not found`() {
        every { userRepository.findByIdOrNull(99L) } returns null
        assertThat(userService.findUser(99L)).isNull()
    }
}
```

### Integration tests — Testcontainers + @SpringBootTest

```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class UserControllerIntegrationTest {

    companion object {
        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")

        @DynamicPropertySource
        @JvmStatic
        fun configureProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    @Autowired
    lateinit var restTemplate: TestRestTemplate

    @Test
    fun `POST users creates and returns user`() {
        val request = CreateUserRequest(name = "Alice", email = "alice@example.com")
        val response = restTemplate.postForEntity("/users", request, UserResponse::class.java)

        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        assertThat(response.body?.name).isEqualTo("Alice")
    }
}
```

### Always use Testcontainers for DB — never H2

H2 has different SQL dialect than PostgreSQL. Tests pass on H2, fail in prod. Use real Postgres via Testcontainers.

---

## Makefile

```makefile
.PHONY: lint test build run

lint:
	./gradlew ktlintCheck

lint-fix:
	./gradlew ktlintFormat

test:
	./gradlew test

build:
	./gradlew bootJar

run:
	./gradlew bootRun
```

---

## CI — GitHub Actions

```yaml
name: CI
on:
  push:
    branches: [main, master]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'
      - run: ./gradlew ktlintCheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'
      - run: ./gradlew test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'
      - run: ./gradlew bootJar
```

## GitLab CI

```yaml
stages: [lint, test, build]

.gradle-cache:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths: [.gradle/, build/]

lint:
  extends: .gradle-cache
  image: eclipse-temurin:21-jdk-alpine
  stage: lint
  script: ./gradlew ktlintCheck

test:
  extends: .gradle-cache
  image: eclipse-temurin:21-jdk-alpine
  stage: test
  services:
    - postgres:16-alpine
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
  script: ./gradlew test

build:
  extends: .gradle-cache
  image: eclipse-temurin:21-jdk-alpine
  stage: build
  script: ./gradlew bootJar
```
