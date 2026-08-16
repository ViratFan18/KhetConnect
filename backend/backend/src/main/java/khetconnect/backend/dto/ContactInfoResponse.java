package khetconnect.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContactInfoResponse {
    private Long id;
    private String name;
    private String phone;
    private boolean canCall;
}
