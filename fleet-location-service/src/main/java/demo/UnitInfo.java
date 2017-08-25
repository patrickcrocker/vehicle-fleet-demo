/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package demo;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.cloud.cloudfoundry.com.fasterxml.jackson.annotation.JsonCreator;
import org.springframework.cloud.cloudfoundry.com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Embeddable;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Embeddable
public class UnitInfo {

	private String unitVin;
	private String engineMake;
	private String customerName;
	private String unitNumber;

	@SuppressWarnings("unused")
	private UnitInfo() {
		this.unitVin = "";
	}

	@JsonCreator
	public UnitInfo(@JsonProperty("unitVin") String unitVin,
					@JsonProperty("engineMake") String engineMake,
					@JsonProperty("customerName") String customerName,
					@JsonProperty("unitNumber") String unitNumber)
	{
		this.unitVin = unitVin;
		this.engineMake = engineMake;

		this.customerName = customerName;
		this.unitNumber = unitNumber;
	}

	@JsonCreator
	public UnitInfo(@JsonProperty("unitVin")String unitVin)
	{
		this.unitVin = unitVin;
	}

	public String getUnitVin() {
		return unitVin;
	}

	public void setUnitVin(String unitVin) {
		this.unitVin = unitVin;
	}

	public String getEngineMake() {
		return engineMake;
	}

	public void setEngineMake(String engineMake) {
		this.engineMake = engineMake;
	}

	public String getCustomerName() {
		return customerName;
	}

	public void setCustomerName(String customerName) {
		this.customerName = customerName;
	}

	public String getUnitNumber() {
		return unitNumber;
	}

	public void setUnitNumber(String unitNumber) {
		this.unitNumber = unitNumber;
	}
}