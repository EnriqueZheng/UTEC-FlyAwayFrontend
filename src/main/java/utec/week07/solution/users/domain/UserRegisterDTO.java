package utec.week07.solution.users.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

@Setter
@Getter
public class UserRegisterDTO {
    @Email
    private String username;

    @Email
    private String email;

    @NotNull
    @NotEmpty
    @Pattern(regexp = "^[A-Z].+")
    private String firstName;

    @NotNull
    @NotEmpty
    @Pattern(regexp = "^[A-Z].+")
    private String lastName;

    @NotNull
    @NotEmpty
    @Length(min = 8)
    private String password;
}
